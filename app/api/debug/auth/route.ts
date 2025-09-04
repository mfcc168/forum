import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { ApiResponse } from '@/lib/utils/validation'

export const runtime = 'nodejs'

/**
 * Debug endpoint to test auth system
 * GET /api/debug/auth
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Debug auth endpoint called')
    
    // Test auth function
    const session = await auth()
    console.log('🔐 Session result:', session ? 'Present' : 'Null')
    
    if (session) {
      console.log('👤 User ID:', session.user?.id)
      console.log('👤 User email:', session.user?.email)
      console.log('👤 User role:', session.user?.role)
    }
    
    return ApiResponse.success({
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.avatar
      } : null,
      timestamp: new Date().toISOString()
    }, 'Auth debug completed')
    
  } catch (error) {
    console.error('❌ Auth debug error:', error)
    return ApiResponse.error(`Auth system error: ${error.message}`, 500)
  }
}