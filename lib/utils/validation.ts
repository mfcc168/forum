import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ratelimit } from '@/lib/utils/ratelimit'
import DOMPurify from 'isomorphic-dompurify'
import type { ServerUser } from "@/lib/types"

// API Response utility for consistent error handling
export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return NextResponse.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    })
  }

  static error(message: string, code = 500, details?: unknown) {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code,
        details,
        timestamp: new Date().toISOString()
      }
    }, { status: code })
  }

  static validationError(errors: z.ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 400,
        details: errors.format(),
        timestamp: new Date().toISOString()
      }
    }, { status: 400 })
  }
}

// Middleware wrapper for API routes with validation, rate limiting, and auth
export function withApiRoute<T extends z.ZodSchema>(
  handler: (
    request: NextRequest,
    context: { params?: Record<string, string>; user?: ServerUser; validatedData?: z.infer<T> }
  ) => Promise<Response>,
  options: {
    schema?: T
    auth?: 'required' | 'optional'
    rateLimit?: { requests: number; window: string }
    method?: string
  } = {}
) {
  return async (request: NextRequest, context: { params?: Record<string, string> } = {}) => {
    try {
      // Method validation
      if (options.method && request.method !== options.method) {
        return ApiResponse.error(`Method ${request.method} not allowed`, 405)
      }

      // Rate limiting
      if (options.rateLimit) {
        const ip = request.headers.get('x-forwarded-for') || 'anonymous'
        const { success, reset, limit, remaining } = await ratelimit.limit(ip)
        
        if (!success) {
          return ApiResponse.error('Too many requests', 429, {
            reset,
            limit,
            remaining
          })
        }
      }

      // Authentication (server-side only)
      let user: ServerUser | undefined = undefined
      if (options.auth && typeof window === 'undefined') {
        try {
          const { getServerUser } = await import('@/lib/auth/server')
          const serverUser = await getServerUser()
          user = serverUser || undefined
          
          if (options.auth === 'required' && !user) {
            return ApiResponse.error('Authentication required', 401)
          }
        } catch (error) {
          console.error('Auth error:', error)
          if (options.auth === 'required') {
            return ApiResponse.error('Authentication required', 401)
          }
        }
      }

      // Request validation
      let validatedData: z.infer<T> | undefined = undefined
      if (options.schema) {
        try {
          if (request.method === 'POST' || request.method === 'PUT') {
            const body = await request.json()
            validatedData = options.schema.parse(body)
          } else if (request.method === 'GET' || request.method === 'DELETE') {
            // For GET/DELETE, validate path parameters first, then query parameters
            let dataToValidate = {}
            
            // Add path parameters (like slug) if they exist
            if (context.params) {
              // Handle both sync and async params (Next.js 15 compatibility)
              const resolvedParams = context.params instanceof Promise 
                ? await context.params 
                : context.params
              dataToValidate = { ...resolvedParams }
            }
            
            // Add query parameters
            const { searchParams } = new URL(request.url)
            const queryObject = Object.fromEntries(searchParams.entries())
            dataToValidate = { ...dataToValidate, ...queryObject }
            
            validatedData = options.schema.parse(dataToValidate)
          }
          
          // Sanitize HTML content if present
          if (validatedData && typeof validatedData === 'object') {
            validatedData = sanitizeObject(validatedData) as z.infer<T>
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            return ApiResponse.validationError(error)
          }
          return ApiResponse.error('Invalid request body', 400)
        }
      }

      // Execute handler
      return await handler(request, { 
        ...context, 
        user, 
        validatedData 
      })

    } catch (error) {
      console.error('API Route Error:', error)
      return ApiResponse.error(
        process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : 'Internal server error',
        500
      )
    }
  }
}

// HTML sanitization utility
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target'],
    ALLOW_DATA_ATTR: false
  })
}

// Recursively sanitize object properties
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Validation schemas for common operations
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
})