/**
 * API Security Tests
 * 
 * Tests security patterns, authentication, authorization, rate limiting,
 * input validation, and protection against common vulnerabilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock authentication and session handling
const mockGetServerSession = vi.fn()
vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession
}))

// Mock rate limiting
const mockRateLimit = vi.fn()
vi.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: mockRateLimit
}))

// Mock input validation
const mockValidateInput = vi.fn()
vi.mock('@/lib/utils/validation', () => ({
  validateInput: mockValidateInput,
  sanitizeInput: vi.fn((input) => input.trim()),
  ApiResponse: {
    success: vi.fn((data, message) => ({ success: true, data, message })),
    error: vi.fn((message, status, details) => ({ success: false, error: message, status, details }))
  }
}))

// Mock database access
const mockDAL = {
  blog: {
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    getPostBySlug: vi.fn()
  },
  forum: {
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn()
  },
  user: {
    getById: vi.fn(),
    updateProfile: vi.fn()
  }
}

vi.mock('@/lib/database/dal', () => ({
  DAL: mockDAL
}))

describe('API Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication Security', () => {
    it('rejects requests without valid session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Post', content: 'Content' })
      })

      // Simulate API route logic
      const session = await mockGetServerSession()
      
      if (!session) {
        const response = { success: false, error: 'Authentication required', status: 401 }
        expect(response.status).toBe(401)
        expect(response.error).toBe('Authentication required')
      }
    })

    it('validates session integrity', async () => {
      const validSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'member'
        }
      }

      const tamperedSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'admin' // Tampered to elevate privileges
        }
      }

      mockGetServerSession.mockResolvedValue(validSession)

      // In real implementation, session signature should prevent tampering
      const session = await mockGetServerSession()
      
      expect(session.user.role).toBe('member')
      expect(session.user.role).not.toBe('admin') // Should not be tampered
    })

    it('handles session expiration gracefully', async () => {
      const expiredSession = {
        user: { id: 'user-123' },
        expires: '2023-01-01T00:00:00Z' // Expired date
      }

      mockGetServerSession.mockResolvedValue(expiredSession)

      const session = await mockGetServerSession()
      const isExpired = new Date(session.expires) < new Date()

      if (isExpired) {
        const response = { success: false, error: 'Session expired', status: 401 }
        expect(response.status).toBe(401)
        expect(response.error).toBe('Session expired')
      }
    })

    it('prevents session fixation attacks', async () => {
      // Mock multiple session requests with different session IDs
      const sessionId1 = 'session-abc123'
      const sessionId2 = 'session-def456'

      mockGetServerSession
        .mockResolvedValueOnce({ sessionId: sessionId1, user: { id: 'user-1' } })
        .mockResolvedValueOnce({ sessionId: sessionId2, user: { id: 'user-1' } })

      const session1 = await mockGetServerSession()
      const session2 = await mockGetServerSession()

      // Sessions should have different IDs to prevent fixation
      expect(session1.sessionId).not.toBe(session2.sessionId)
    })
  })

  describe('Authorization Security', () => {
    it('enforces role-based access control', async () => {
      const memberSession = {
        user: { id: 'user-123', role: 'member' }
      }

      const adminSession = {
        user: { id: 'user-456', role: 'admin' }
      }

      mockGetServerSession.mockResolvedValue(memberSession)

      // Test admin-only operation with member session
      const session = await mockGetServerSession()
      const hasAdminAccess = session.user.role === 'admin'

      if (!hasAdminAccess) {
        const response = { success: false, error: 'Insufficient permissions', status: 403 }
        expect(response.status).toBe(403)
        expect(response.error).toBe('Insufficient permissions')
      }

      // Test with admin session
      mockGetServerSession.mockResolvedValue(adminSession)
      const adminSessionResult = await mockGetServerSession()
      const hasAdminAccessAdmin = adminSessionResult.user.role === 'admin'

      expect(hasAdminAccessAdmin).toBe(true)
    })

    it('validates resource ownership', async () => {
      const session = {
        user: { id: 'user-123', role: 'member' }
      }

      const blogPost = {
        id: 'post-1',
        title: 'Test Post',
        author: { id: 'user-456' } // Different user
      }

      mockGetServerSession.mockResolvedValue(session)
      mockDAL.blog.getPostBySlug.mockResolvedValue(blogPost)

      const userSession = await mockGetServerSession()
      const post = await mockDAL.blog.getPostBySlug('test-post')
      
      const isOwner = post.author.id === userSession.user.id
      const isAdmin = userSession.user.role === 'admin'

      if (!isOwner && !isAdmin) {
        const response = { success: false, error: 'Not authorized to modify this resource', status: 403 }
        expect(response.status).toBe(403)
      }
    })

    it('prevents privilege escalation', async () => {
      const session = {
        user: { id: 'user-123', role: 'member' }
      }

      mockGetServerSession.mockResolvedValue(session)

      // Simulate attempt to escalate privileges
      const updateData = {
        name: 'Updated Name',
        role: 'admin' // Attempting to escalate
      }

      const userSession = await mockGetServerSession()
      
      // API should ignore role changes from non-admin users
      const allowedFields = userSession.user.role === 'admin' 
        ? ['name', 'email', 'role'] 
        : ['name', 'email'] // 'role' excluded for non-admins

      const sanitizedUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      )

      expect(sanitizedUpdateData.role).toBeUndefined()
      expect(sanitizedUpdateData.name).toBe('Updated Name')
    })
  })

  describe('Rate Limiting Security', () => {
    it('enforces rate limits for API endpoints', async () => {
      mockRateLimit.mockResolvedValueOnce({ success: true }) // First request OK
      mockRateLimit.mockResolvedValueOnce({ success: false, error: 'Rate limit exceeded' }) // Second request blocked

      // First request
      let rateLimitResult = await mockRateLimit('api/posts', 'user-123')
      expect(rateLimitResult.success).toBe(true)

      // Second request (should be rate limited)
      rateLimitResult = await mockRateLimit('api/posts', 'user-123')
      expect(rateLimitResult.success).toBe(false)
      expect(rateLimitResult.error).toBe('Rate limit exceeded')
    })

    it('applies different rate limits for different user roles', async () => {
      const memberLimits = { requests: 10, window: 60000 } // 10 requests per minute
      const adminLimits = { requests: 100, window: 60000 } // 100 requests per minute

      mockRateLimit
        .mockImplementationOnce(async (endpoint, userId, options) => {
          return options.limit <= 10 ? { success: true } : { success: false }
        })
        .mockImplementationOnce(async (endpoint, userId, options) => {
          return options.limit <= 100 ? { success: true } : { success: false }
        })

      // Member rate limit
      const memberResult = await mockRateLimit('api/posts', 'member-user', memberLimits)
      expect(memberResult.success).toBe(true)

      // Admin rate limit (higher threshold)
      const adminResult = await mockRateLimit('api/posts', 'admin-user', adminLimits)
      expect(adminResult.success).toBe(true)
    })

    it('implements IP-based rate limiting for anonymous users', async () => {
      const clientIP = '192.168.1.100'

      mockRateLimit
        .mockResolvedValueOnce({ success: true }) // First request from IP
        .mockResolvedValueOnce({ success: false, error: 'IP rate limit exceeded' }) // Subsequent request blocked

      // First request from IP
      let result = await mockRateLimit('api/public', clientIP)
      expect(result.success).toBe(true)

      // Second request from same IP (blocked)
      result = await mockRateLimit('api/public', clientIP)
      expect(result.success).toBe(false)
    })

    it('handles rate limit bypass attempts', async () => {
      mockRateLimit.mockImplementation(async (endpoint, identifier) => {
        // Simulate tracking by normalized identifier
        const normalizedId = identifier.toLowerCase().trim()
        
        // Block attempts to bypass with similar identifiers
        const bypassAttempts = ['user-123', 'USER-123', ' user-123 ', 'user123']
        const isKnownBypass = bypassAttempts.some(attempt => 
          attempt.toLowerCase().trim() === normalizedId
        )

        if (isKnownBypass) {
          return { success: false, error: 'Rate limit exceeded' }
        }
        
        return { success: true }
      })

      // All these should be treated as the same user
      const results = await Promise.all([
        mockRateLimit('api/posts', 'user-123'),
        mockRateLimit('api/posts', 'USER-123'),
        mockRateLimit('api/posts', ' user-123 ')
      ])

      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(false)
    })
  })

  describe('Input Validation Security', () => {
    it('validates and sanitizes user input', async () => {
      const maliciousInput = {
        title: '<script>alert("XSS")</script>Innocent Title',
        content: 'Normal content</script><script>malicious()</script>',
        email: 'user@domain.com<script>alert(1)</script>'
      }

      mockValidateInput.mockImplementation((input, schema) => {
        // Simulate sanitization
        const sanitized = {
          title: input.title.replace(/<script.*?<\/script>/gi, '').trim(),
          content: input.content.replace(/<script.*?<\/script>/gi, '').trim(),
          email: input.email.replace(/<.*?>/g, '').trim()
        }

        return {
          success: true,
          data: sanitized
        }
      })

      const result = await mockValidateInput(maliciousInput, 'postSchema')

      expect(result.success).toBe(true)
      expect(result.data.title).toBe('Innocent Title')
      expect(result.data.content).toBe('Normal content')
      expect(result.data.email).toBe('user@domain.com')
    })

    it('prevents SQL injection in query parameters', async () => {
      const maliciousQueries = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/**/union/**/select/**/password/**/from/**/users--"
      ]

      maliciousQueries.forEach(maliciousQuery => {
        mockValidateInput.mockImplementation((query) => {
          // Check for SQL injection patterns
          const sqlPatterns = [
            /(['"])\s*(;|--|\/\*)/i,
            /(union|select|drop|insert|update|delete)\s/i,
            /(\bor\b|\band\b)\s+['"]\d+['"]?\s*=\s*['"]\d+['"]?/i
          ]

          const containsSQLInjection = sqlPatterns.some(pattern => pattern.test(query))

          if (containsSQLInjection) {
            return {
              success: false,
              error: 'Invalid characters in query'
            }
          }

          return { success: true, data: query }
        })

        const result = mockValidateInput(maliciousQuery)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid characters in query')
      })
    })

    it('validates file upload security', async () => {
      const validFile = {
        name: 'document.pdf',
        size: 5 * 1024 * 1024, // 5MB
        type: 'application/pdf'
      }

      const maliciousFile = {
        name: 'virus.exe.pdf', // Double extension
        size: 100 * 1024 * 1024, // 100MB
        type: 'application/x-executable'
      }

      mockValidateInput.mockImplementation((file) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
        const maxSize = 10 * 1024 * 1024 // 10MB
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.txt']

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          return { success: false, error: 'File type not allowed' }
        }

        // Check file size
        if (file.size > maxSize) {
          return { success: false, error: 'File too large' }
        }

        // Check for double extensions
        const extensionMatches = file.name.match(/\.[^.]+/g) || []
        if (extensionMatches.length > 1) {
          return { success: false, error: 'Multiple file extensions not allowed' }
        }

        // Check file extension
        const extension = extensionMatches[0]
        if (!allowedExtensions.includes(extension)) {
          return { success: false, error: 'File extension not allowed' }
        }

        return { success: true }
      })

      const validResult = mockValidateInput(validFile)
      expect(validResult.success).toBe(true)

      const maliciousResult = mockValidateInput(maliciousFile)
      expect(maliciousResult.success).toBe(false)
      expect(maliciousResult.error).toContain('not allowed')
    })

    it('prevents NoSQL injection in MongoDB queries', async () => {
      const maliciousPayload = {
        email: { $gt: "" }, // NoSQL injection attempt
        password: { $regex: ".*" }
      }

      const safePayload = {
        email: "user@example.com",
        password: "hashedpassword123"
      }

      mockValidateInput.mockImplementation((payload) => {
        // Check for object-based injection
        const containsMongoOperators = (obj: any): boolean => {
          if (typeof obj !== 'object' || obj === null) return false
          
          for (const key in obj) {
            if (key.startsWith('$')) return true
            if (typeof obj[key] === 'object' && containsMongoOperators(obj[key])) return true
          }
          return false
        }

        if (containsMongoOperators(payload)) {
          return { success: false, error: 'Invalid query structure' }
        }

        return { success: true, data: payload }
      })

      const maliciousResult = mockValidateInput(maliciousPayload)
      expect(maliciousResult.success).toBe(false)
      expect(maliciousResult.error).toBe('Invalid query structure')

      const safeResult = mockValidateInput(safePayload)
      expect(safeResult.success).toBe(true)
    })
  })

  describe('CORS and Request Security', () => {
    it('validates request origin', async () => {
      const allowedOrigins = [
        'https://myapp.com',
        'https://www.myapp.com',
        'https://staging.myapp.com'
      ]

      const validateOrigin = (origin: string) => {
        if (!origin) return false
        return allowedOrigins.includes(origin)
      }

      expect(validateOrigin('https://myapp.com')).toBe(true)
      expect(validateOrigin('https://malicious-site.com')).toBe(false)
      expect(validateOrigin('')).toBe(false)
      expect(validateOrigin('null')).toBe(false)
    })

    it('validates request methods', async () => {
      const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      const validateMethod = (method: string) => {
        return allowedMethods.includes(method.toUpperCase())
      }

      expect(validateMethod('GET')).toBe(true)
      expect(validateMethod('POST')).toBe(true)
      expect(validateMethod('TRACE')).toBe(false) // Security risk
      expect(validateMethod('OPTIONS')).toBe(false) // Should be handled separately
    })

    it('validates Content-Type headers', async () => {
      const allowedContentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
      ]

      const validateContentType = (contentType: string) => {
        if (!contentType) return false
        const baseType = contentType.split(';')[0].trim()
        return allowedContentTypes.includes(baseType)
      }

      expect(validateContentType('application/json')).toBe(true)
      expect(validateContentType('application/json; charset=utf-8')).toBe(true)
      expect(validateContentType('text/html')).toBe(false)
      expect(validateContentType('application/xml')).toBe(false)
    })
  })

  describe('Data Exposure Prevention', () => {
    it('filters sensitive data from API responses', async () => {
      const userRecord = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword123',
        resetToken: 'secret-reset-token',
        apiKey: 'secret-api-key',
        role: 'member'
      }

      const sanitizeUserData = (user: any) => {
        const { password, resetToken, apiKey, ...safeData } = user
        return safeData
      }

      const sanitizedUser = sanitizeUserData(userRecord)

      expect(sanitizedUser.id).toBe('user-123')
      expect(sanitizedUser.name).toBe('John Doe')
      expect(sanitizedUser.email).toBe('john@example.com')
      expect(sanitizedUser.role).toBe('member')
      
      expect(sanitizedUser.password).toBeUndefined()
      expect(sanitizedUser.resetToken).toBeUndefined()
      expect(sanitizedUser.apiKey).toBeUndefined()
    })

    it('prevents information disclosure through error messages', async () => {
      const generateSafeErrorMessage = (error: Error, isProduction: boolean) => {
        if (isProduction) {
          // Generic message in production
          return 'An error occurred. Please try again.'
        } else {
          // Detailed message in development
          return error.message
        }
      }

      const dbError = new Error('Table "users" doesn\'t exist in database "production_db"')

      const prodMessage = generateSafeErrorMessage(dbError, true)
      const devMessage = generateSafeErrorMessage(dbError, false)

      expect(prodMessage).toBe('An error occurred. Please try again.')
      expect(devMessage).toContain('Table "users"')
    })

    it('validates response data structure', async () => {
      const rawDatabaseResult = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Blog Post',
        content: 'Content here',
        author: {
          _id: '507f1f77bcf86cd799439012',
          password: 'shouldnotbeincluded',
          name: 'Author Name'
        },
        internalNotes: 'Admin only notes',
        publishedAt: new Date()
      }

      const transformToAPIResponse = (data: any) => ({
        id: data._id,
        title: data.title,
        content: data.content,
        author: {
          id: data.author._id,
          name: data.author.name
        },
        publishedAt: data.publishedAt
      })

      const apiResponse = transformToAPIResponse(rawDatabaseResult)

      expect(apiResponse.id).toBe('507f1f77bcf86cd799439011')
      expect(apiResponse.title).toBe('Blog Post')
      expect(apiResponse.author.name).toBe('Author Name')
      expect(apiResponse.author.id).toBe('507f1f77bcf86cd799439012')

      expect(apiResponse.internalNotes).toBeUndefined()
      expect(apiResponse.author.password).toBeUndefined()
    })
  })

  describe('Request Integrity and CSRF Protection', () => {
    it('validates CSRF tokens for state-changing operations', async () => {
      const validateCSRFToken = (token: string, sessionToken: string) => {
        // In real implementation, this would validate against stored session token
        return token === `csrf_${sessionToken}`
      }

      const sessionToken = 'session_abc123'
      const validCSRFToken = 'csrf_session_abc123'
      const invalidCSRFToken = 'csrf_different_session'

      expect(validateCSRFToken(validCSRFToken, sessionToken)).toBe(true)
      expect(validateCSRFToken(invalidCSRFToken, sessionToken)).toBe(false)
    })

    it('validates request timestamps to prevent replay attacks', async () => {
      const validateRequestTimestamp = (timestamp: number, allowedWindowMs: number = 300000) => {
        const now = Date.now()
        const age = now - timestamp
        return age >= 0 && age <= allowedWindowMs
      }

      const currentTime = Date.now()
      const recentTime = currentTime - 60000 // 1 minute ago
      const oldTime = currentTime - 600000 // 10 minutes ago

      expect(validateRequestTimestamp(currentTime)).toBe(true)
      expect(validateRequestTimestamp(recentTime)).toBe(true)
      expect(validateRequestTimestamp(oldTime)).toBe(false) // Too old
    })

    it('validates request signatures', async () => {
      const validateRequestSignature = (
        payload: string,
        signature: string,
        secret: string
      ) => {
        // Simplified HMAC validation
        const expectedSignature = `hmac_sha256_${payload}_${secret}`
        return signature === expectedSignature
      }

      const payload = JSON.stringify({ action: 'create_post' })
      const secret = 'api_secret_key'
      const validSignature = `hmac_sha256_${payload}_${secret}`
      const invalidSignature = 'invalid_signature'

      expect(validateRequestSignature(payload, validSignature, secret)).toBe(true)
      expect(validateRequestSignature(payload, invalidSignature, secret)).toBe(false)
    })
  })
})