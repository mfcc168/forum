import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Return user data
    return NextResponse.json({
      id: user.id,
      username: user.name,  // Map name to username for API compatibility
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      joinDate: user.createdAt,
      lastActive: user.lastActiveAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}