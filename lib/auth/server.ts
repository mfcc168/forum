// Server-side auth utilities that can use Node.js runtime
import { auth } from "@/auth"
import clientPromise from "@/lib/database/connection/mongodb"
import type { ServerUser } from '@/lib/types'

export async function getServerUser(): Promise<ServerUser | null> {
  console.log('getServerUser: Starting authentication check')
  console.log('getServerUser: MONGODB_URI exists:', !!process.env.MONGODB_URI)
  
  const session = await auth()
  console.log('getServerUser: Session exists:', !!session)
  console.log('getServerUser: Session user email:', session?.user?.email ? 'exists' : 'missing')
  
  if (!session?.user?.email) {
    console.log('getServerUser: No session or email, returning null')
    return null
  }

  try {
    console.log('getServerUser: Attempting MongoDB connection...')
    const client = await clientPromise
    console.log('getServerUser: MongoDB client connected successfully')
    const db = client.db('minecraft_server')
    
    // First check if user exists
    let user = await db.collection('users').findOne({
      email: session.user.email
    })

    // If user doesn't exist (new Discord user), create them
    if (!user && session.user.id) {
      const newUser = {
        username: session.user.name || 'Unknown User',
        email: session.user.email,
        discordId: session.user.id,
        avatar: session.user.avatar || undefined,
        role: 'member',
        joinDate: new Date(),
        lastActive: new Date(),
        isActive: true
      }
      
      const result = await db.collection('users').insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
    } else if (user) {
      // Update last active time for existing user
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastActive: new Date(),
            avatar: session.user.avatar || user.avatar,
            username: session.user.name || user.username
          }
        }
      )
    }

    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      name: user.username,  // Map username to name
      email: user.email,
      discordId: user.discordId,
      avatar: user.avatar,
      role: user.role || 'member',
      createdAt: user.joinDate ? user.joinDate.toISOString() : new Date().toISOString(),
      lastActiveAt: user.lastActive ? user.lastActive.toISOString() : new Date().toISOString(),
      status: user.isActive ? 'active' : 'suspended',
      minecraftUsername: user.minecraftUsername
    }
  } catch (error) {
    console.error('getServerUser: Error fetching/creating user:', error)
    console.error('getServerUser: Error type:', error instanceof Error ? error.constructor.name : 'Unknown')
    console.error('getServerUser: Error message:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

export async function requireAuth() {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}