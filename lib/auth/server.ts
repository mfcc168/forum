// Server-side auth utilities that can use Node.js runtime
import { auth } from "@/auth"
import clientPromise from "@/lib/database/connection/mongodb"
import type { ServerUser } from '@/lib/types'

export async function getServerUser(): Promise<ServerUser | null> {
  const session = await auth()
  
  if (!session?.user?.email) {
    return null
  }

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
    console.error('Error fetching/creating user:', error)
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