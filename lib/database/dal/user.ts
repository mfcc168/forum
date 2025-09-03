/**
 * User Database Access Layer
 * 
 * Centralized database operations for users, authentication, and user profiles.
 */

import { Filter } from 'mongodb'
import { BaseDAL } from './base'
import { MongoUserSchema, type User } from '@/lib/database/schemas'
import { handleDatabaseError } from '@/lib/utils/error-handler'

export interface UserWithActivity extends User {
  recentPostsCount: number
  recentRepliesCount: number
  lastPostAt?: Date | string
  isOnline: boolean
}

export class UserDAL extends BaseDAL<User> {
  constructor() {
    super('users')
  }

  /**
   * Create new user with default settings
   */
  async createUser(userData: {
    email: string
    name: string
    image?: string
    provider?: 'discord' | 'google'
    providerId?: string
  }): Promise<string> {
    try {
      const now = new Date()
      
      const user: Omit<User, '_id'> = {
        id: '',
        email: userData.email,
        name: userData.name,
        avatar: userData.image,
        role: 'member',
        status: 'active',
        profile: {
          minecraft: {}
        },
        stats: {
          posts: 0,
          replies: 0,
          likes: 0,
          reputation: 0,
          level: 1
        },
        preferences: {
          language: 'en',
          theme: 'auto',
          notifications: {
            email: true,
            push: true,
            mentions: true,
            replies: true
          }
        },
        providers: {},
        lastActiveAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }

      // Set OAuth provider data when available
      if (userData.provider && userData.providerId) {
        if (userData.provider === 'discord') {
          user.providers.discord = {
            id: userData.providerId,
            username: userData.name,
            discriminator: '0000'
          }
        } else if (userData.provider === 'google') {
          user.providers.google = {
            id: userData.providerId,
            email: userData.email
          }
        }
      }

      const result = await this.insertOne(user)
      return result.insertedId.toString()
    } catch (error) {
      handleDatabaseError(error, 'create user')
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email, isDeleted: { $ne: true } } as Filter<User>)
  }

  /**
   * Find user by provider ID
   */
  async findByProvider(provider: 'discord' | 'google', providerId: string): Promise<User | null> {
    const filter: Filter<User> = { isDeleted: { $ne: true } }
    
    if (provider === 'discord') {
      filter['providers.discord.id'] = providerId
    } else if (provider === 'google') {
      filter['providers.google.id'] = providerId
    }

    return this.findOne(filter)
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: Partial<User['profile']>): Promise<boolean> {
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date()
    }
    
    // Update only non-undefined profile fields
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[`profile.${key}`] = value
      }
    })

    const result = await this.updateById(userId, {
      $set: updateFields
    })

    return result.modifiedCount > 0
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<User['preferences']>): Promise<boolean> {
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date()
    }
    
    // Update only non-undefined preference fields
    Object.entries(preferences).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields[`preferences.${key}`] = value
      }
    })

    const result = await this.updateById(userId, {
      $set: updateFields
    })

    return result.modifiedCount > 0
  }

  /**
   * Update user stats (posts, replies, likes, etc.)
   */
  async updateStats(userId: string, statUpdates: Partial<User['stats']>): Promise<boolean> {
    const incFields: Record<string, number> = {}
    
    // Build MongoDB $inc update object
    Object.entries(statUpdates).forEach(([key, value]) => {
      if (typeof value === 'number') {
        incFields[`stats.${key}`] = value
      }
    })

    const result = await this.updateById(userId, {
      $inc: incFields,
      $set: { updatedAt: new Date().toISOString() }
    })

    return result.modifiedCount > 0
  }

  /**
   * Increment user stats
   */
  async incrementStats(userId: string, stats: {
    postsCount?: number
    repliesCount?: number
    likesReceived?: number
    reputation?: number
  }): Promise<boolean> {
    const updateDoc: Record<string, number> = {}
    
    // Map parameter names to database field names
    const fieldMapping = {
      postsCount: 'posts',
      repliesCount: 'replies', 
      likesReceived: 'likes',
      reputation: 'reputation'
    }
    
    Object.entries(stats).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const schemaField = fieldMapping[key as keyof typeof fieldMapping] || key
        updateDoc[`stats.${schemaField}`] = value
      }
    })

    const result = await this.updateById(userId, {
      $inc: updateDoc,
      $set: { updatedAt: new Date().toISOString() }
    })

    return result.modifiedCount > 0
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(userId: string): Promise<boolean> {
    const result = await this.updateById(userId, {
      $set: { lastActive: new Date() }
    })

    return result.modifiedCount > 0
  }

  /**
   * Change user role
   */
  async changeRole(userId: string, role: User['role']): Promise<boolean> {
    const result = await this.updateById(userId, {
      $set: {
        role,
        updatedAt: new Date().toISOString()
      }
    })

    return result.modifiedCount > 0
  }

  /**
   * Ban/suspend user
   */
  async changeStatus(userId: string, status: User['status'], reason?: string): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date()
    }

    if (reason && (status === 'banned' || status === 'suspended')) {
      updateData.banReason = reason
      updateData.bannedAt = new Date()
    }

    const result = await this.updateById(userId, { $set: updateData })
    return result.modifiedCount > 0
  }

  /**
   * Get users with activity data
   */
  async getUsersWithActivity(filters: {
    role?: User['role']
    status?: User['status']
    online?: boolean
    page?: number
    limit?: number
  } = {}): Promise<{
    users: UserWithActivity[]
    total: number
  }> {
    const { page = 1, limit = 20, role, status, online } = filters
    const skip = (page - 1) * limit

    // Build base filter for user queries
    const filter: Filter<User> = { isDeleted: { $ne: true } }
    if (role) filter.role = role
    if (status) filter.status = status
    if (online) {
      // Users active within last 15 minutes are considered online
      const cutoff = new Date(Date.now() - 15 * 60 * 1000)
      filter.lastActive = { $gte: cutoff }
    }

    // MongoDB aggregation pipeline with activity lookups
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'forumPosts',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$author', '$$userId'] },
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            },
            { $count: 'count' }
          ],
          as: 'recentPostsData'
        }
      },
      {
        $addFields: {
          recentPosts: { $ifNull: [{ $arrayElemAt: ['$recentPostsData.count', 0] }, 0] },
          recentReplies: 0,
          isOnline: {
            $gte: ['$lastActive', new Date(Date.now() - 15 * 60 * 1000)]
          }
        }
      },
      { $unset: 'recentPostsData' },
      { $sort: { lastActive: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]

    const [rawUsers, total] = await Promise.all([
      this.aggregate(pipeline),
      this.count(filter)
    ])

    // Transform raw MongoDB documents to typed user objects
    const users: UserWithActivity[] = rawUsers.map((doc: Record<string, unknown>) => {
      const baseUser = MongoUserSchema.parse(doc)
      return {
        ...baseUser,
        recentPostsCount: (doc.recentPosts as number) || 0,
        recentRepliesCount: (doc.recentReplies as number) || 0,
        lastPostAt: doc.lastPostAt as Date | string | undefined,
        isOnline: (doc.isOnline as boolean) || false
      }
    })

    return { users, total }
  }

  /**
   * Get online users count
   */
  async getOnlineUsersCount(): Promise<number> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000)
    return this.count({
      lastActive: { $gte: cutoff },
      status: 'active',
      isDeleted: { $ne: true }
    } as Filter<User>)
  }

  /**
   * Get user leaderboard by reputation
   */
  async getLeaderboard(limit: number = 10): Promise<User[]> {
    const rawUsers = await this.find(
      { 
        status: 'active',
        isDeleted: { $ne: true }
      } as Filter<User>,
      {
        sort: { 'stats.reputation': -1, 'stats.postsCount': -1 },
        limit
      }
    )

    // Parse and validate documents with Zod schema
    return rawUsers.map(doc => MongoUserSchema.parse(doc))
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const filter: Filter<User> = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { 'profile.minecraft.username': { $regex: query, $options: 'i' } }
      ],
      status: 'active',
      isDeleted: { $ne: true }
    }

    const rawUsers = await this.find(filter, { limit })
    
    // Parse and validate search results with Zod schema
    return rawUsers.map(doc => MongoUserSchema.parse(doc))
  }
}