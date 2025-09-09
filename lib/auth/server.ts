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

  // If we have a valid session, create a ServerUser from session data
  // without requiring database access for basic functionality
  const sessionUser: ServerUser = {
    id: session.user.id || 'unknown',
    name: session.user.name || 'Unknown User',
    email: session.user.email,
    discordId: session.user.id,
    avatar: session.user.avatar || session.user.image,
    role: (session.user.role as ServerUser['role']) || 'member',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'active'
  }

  // Try to enhance with database data, but don't fail if DB is unavailable
  try {
    console.log('getServerUser: Attempting MongoDB connection for user data enhancement...')
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

    if (user) {
      // Update session user with database data
      console.log('getServerUser: Found user in database, updating session data')
      sessionUser.id = user._id.toString()
      sessionUser.name = user.username || sessionUser.name
      sessionUser.role = user.role || sessionUser.role
      sessionUser.createdAt = user.joinDate ? user.joinDate.toISOString() : sessionUser.createdAt
      sessionUser.lastActiveAt = user.lastActive ? user.lastActive.toISOString() : sessionUser.lastActiveAt
      sessionUser.status = user.isActive ? 'active' : 'suspended'
      sessionUser.minecraftUsername = user.minecraftUsername
      
      // Update last active time for existing user
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastActive: new Date(),
            avatar: session.user.avatar || session.user.image || user.avatar,
            username: session.user.name || user.username
          }
        }
      )
    } else if (session.user.id) {
      // Create new user in database
      console.log('getServerUser: Creating new user in database')
      const newUser = {
        username: session.user.name || 'Unknown User',
        email: session.user.email,
        discordId: session.user.id,
        avatar: session.user.avatar || session.user.image,
        role: 'member',
        joinDate: new Date(),
        lastActive: new Date(),
        isActive: true
      }
      
      const result = await db.collection('users').insertOne(newUser)
      sessionUser.id = result.insertedId.toString()
    }

    console.log('getServerUser: Returning enhanced user data')
    return sessionUser

  } catch (error) {
    console.error('getServerUser: Error fetching/creating user (using session fallback):', error)
    console.error('getServerUser: Error type:', error instanceof Error ? error.constructor.name : 'Unknown')
    console.error('getServerUser: Error message:', error instanceof Error ? error.message : 'Unknown error')
    
    // Don't fail! Return the session-based user data
    console.log('getServerUser: Database unavailable, returning session-based user data')
    return sessionUser
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