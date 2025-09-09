import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'

export const runtime = 'nodejs'

/**
 * GET /api/auth/user
 * Get current authenticated user information
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { user }: { user?: ServerUser }) => {
    try {
      // Use the user from middleware (which uses getServerUser internally)
      if (!user) {
        return ApiResponse.error('Not authenticated', 401)
      }

      // Return user data in consistent format
      const userData = {
        id: user.id,
        username: user.name,  // Map name to username for API compatibility
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        joinDate: user.createdAt,
        lastActive: user.lastActiveAt,
      }

      return ApiResponse.success(userData, 'User information retrieved successfully')
    } catch (error) {
      console.error('Error fetching user:', error)
      return ApiResponse.error('Failed to fetch user information', 500)
    }
  },
  {
    auth: 'required',
    rateLimit: { requests: 30, window: '1m' }
  }
)