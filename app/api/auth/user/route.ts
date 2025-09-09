import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/validation'
import { getServerUser } from '@/lib/auth/server'

export const runtime = 'nodejs'

/**
 * GET /api/auth/user
 * Get current authenticated user information
 */
export async function GET(_request: NextRequest) {
  try {
    // Get user using our server auth function
    const user = await getServerUser()
    
    if (!user) {
      return ApiResponse.error('Not authenticated', 401)
    }

    // Return user data in consistent format
    return ApiResponse.success({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        minecraftUsername: user.minecraftUsername
      }
    }, 'User data retrieved successfully')
  } catch (error) {
    console.error('Error getting user data:', error)
    return ApiResponse.error('Failed to get user data', 500)
  }
}