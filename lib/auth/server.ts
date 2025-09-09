// Server-side auth utilities that can use Node.js runtime
import { auth } from "@/auth"
import clientPromise from "@/lib/database/connection/mongodb"
import type { ServerUser } from '@/lib/types'

export async function getServerUser(): Promise<ServerUser | null> {
  const session = await auth()
  
  if (!session?.user?.email) {
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
    const client = await clientPromise
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

    return sessionUser

  } catch (error) {
    // Don't fail! Return the session-based user data
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