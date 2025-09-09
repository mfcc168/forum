/**
 * Database Middleware
 * 
 * Provides database access layer injection for API routes.
 * Replaces manual database connection management.
 */

import { NextRequest } from 'next/server'
import { withApiRoute } from '@/lib/utils/validation'
import { DAL } from './dal'

export interface DatabaseContext {
  dal: typeof DAL
}

export type RouteHandlerWithDAL<T = Record<string, unknown>> = (
  request: NextRequest,
  context: DatabaseContext & T
) => Promise<Response>

/**
 * Enhanced version that combines with existing withApiRoute wrapper
 */
export function withDALAndValidation<T = Record<string, unknown>>(
  handler: RouteHandlerWithDAL<T>,
  options?: {
    auth?: 'required' | 'optional'
    schema?: unknown
    rateLimit?: { requests: number; window: string }
  }
) {
  // Use imported withApiRoute function (no dynamic require needed)
  
  // Create a wrapper that adds DAL to the existing validation context
  const enhancedHandler = (request: NextRequest, context: Record<string, unknown>) => {
    const dalContext = {
      ...context,
      dal: DAL
    } as DatabaseContext & T
    return handler(request, dalContext)
  }

  return withApiRoute(enhancedHandler, options)
}

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  collections: string[]
  error?: string
}> {
  try {
    // Test basic operations
    await DAL.user.count()
    await DAL.forum.count()
    
    return {
      connected: true,
      collections: ['users', 'forumPosts', 'userInteractions', 'forumCategories']
    }
  } catch (error) {
    return {
      connected: false,
      collections: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Database statistics for monitoring
 */
export async function getDatabaseStats(): Promise<{
  collections: {
    users: number
    posts: number
    interactions: number
    categories: number
  }
  performance: {
    avgResponseTime: number
    errors: number
  }
}> {
  try {
    const startTime = Date.now()
    
    const [userCount, postCount, categories] = await Promise.all([
      DAL.user.count(),
      DAL.forum.count(),
      DAL.forum.getCategories()
    ])

    const responseTime = Date.now() - startTime

    return {
      collections: {
        users: userCount,
        posts: postCount,
        interactions: 0, // Would need to implement interaction count
        categories: categories.length
      },
      performance: {
        avgResponseTime: responseTime,
        errors: 0 // Would need error tracking
      }
    }
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error}`)
  }
}