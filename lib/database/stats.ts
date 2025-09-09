/**
 * Simplified Stats System
 * 
 * Uses embedded stats in main documents with atomic operations.
 * Much simpler, more reliable, and easier to debug than the complex
 * pre-computed stats system.
 */

import { ObjectId, Db } from 'mongodb'
import getClientPromise from '@/lib/database/connection/mongodb'
import type { ForumPost } from '@/lib/database/schemas'
import type { UserInteraction, DetailedInteractionResponse } from '@/lib/types'
import { statsBroadcaster } from '@/lib/websocket/stats-broadcaster'

export class StatsManager {
  private db: Db | null = null

  private async getDb(): Promise<Db> {
    if (!this.db) {
      const client = await getClientPromise()
      this.db = client.db('minecraft_server')
    }
    return this.db
  }

  /**
   * Handle user interaction with atomic stats update
   * Returns current stats and interaction state
   */
  async handleInteraction(
    userId: string,
    postId: string,
    action: 'like' | 'bookmark' | 'share'
  ): Promise<DetailedInteractionResponse> {
    if (!userId || !postId || !action) {
      throw new Error('Invalid parameters: userId, postId, and action are required')
    }

    try {
      const db = await this.getDb()
    
    // Check current interaction state
    const existingInteraction = await db.collection<UserInteraction>('userInteractions').findOne({
      userId: userId,
      targetId: postId,
      targetType: 'post',
      interactionType: action === 'bookmark' ? 'bookmark' : action
    })

    const isRemoving = !!existingInteraction
    const statField = `stats.${action === 'bookmark' ? 'bookmarksCount' : action + 'sCount'}`
    const increment = isRemoving ? -1 : 1

    // Start transaction for atomic operation
    const client = await getClientPromise()
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        if (isRemoving) {
          // Remove interaction
          await db.collection('userInteractions').deleteOne(
            { _id: existingInteraction._id },
            { session }
          )
        } else {
          // Add interaction
          await db.collection<UserInteraction>('userInteractions').insertOne({
            _id: new ObjectId(),
            id: new ObjectId().toString(),
            userId: userId,
            targetId: postId,
            targetType: 'post',
            interactionType: action === 'bookmark' ? 'bookmark' : action,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { session })
        }

        // Update post stats atomically
        await db.collection<ForumPost>('forumPosts').updateOne(
          { _id: new ObjectId(postId) },
          { 
            $inc: { [statField]: increment },
            $set: { updatedAt: new Date().toISOString() }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    // Get updated post with current stats
    const updatedPost = await db.collection<ForumPost>('forumPosts').findOne(
      { _id: new ObjectId(postId) },
      { projection: { stats: 1 } }
    )

    // Verify the post exists
    if (!updatedPost) {
      throw new Error('Post not found')
    }

    // Get current user interactions for this post
    const userInteractions = await this.getUserInteractions(userId, [postId])

    return {
      success: true,
      action: isRemoving ? 'removed' : 'added',
      currentState: !isRemoving,
      isNew: !isRemoving,
      stats: {
        viewsCount: updatedPost.stats?.viewsCount || 0,
        likesCount: updatedPost.stats?.likesCount || 0,
        bookmarksCount: updatedPost.stats?.bookmarksCount || 0,
        sharesCount: updatedPost.stats?.sharesCount || 0,
        repliesCount: updatedPost.stats?.repliesCount || 0,
        helpfulsCount: updatedPost.stats?.helpfulsCount || 0
      },
      interactions: {
        isLiked: userInteractions.has('like'),
        isBookmarked: userInteractions.has('bookmark'),
        isShared: action === 'share' ? !isRemoving : false
      }
    }
    } catch (error) {
      console.error('Stats interaction error:', error)
      throw new Error(`Failed to ${action} post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Record forum view interaction (no toggle, just increment)
   */
  async recordForumView(userId: string, postId: string): Promise<boolean> {
    const db = await this.getDb()

    // Check if user already viewed this post recently (last 24h)
    const recentView = await db.collection<UserInteraction>('userInteractions').findOne({
      userId: userId,
      targetId: postId,
      targetType: 'post',
      interactionType: 'view',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    })

    if (recentView) {
      return false // Don't count duplicate views
    }

    // Start transaction
    const client = await getClientPromise()
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Use upsert to handle potential race conditions
        const result = await db.collection<UserInteraction>('userInteractions').updateOne(
          {
            userId: userId,
            targetId: postId,
            targetType: 'post',
            interactionType: 'view'
          },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              id: new ObjectId().toString(),
              userId: userId,
              targetId: postId,
              targetType: 'post',
              interactionType: 'view',
              createdAt: new Date().toISOString()
            },
            $set: {
              updatedAt: new Date().toISOString()
            }
          },
          { 
            upsert: true,
            session 
          }
        )

        // Only increment view count if this is a new view record
        if (result.upsertedCount > 0) {
          await db.collection<ForumPost>('forumPosts').updateOne(
            { _id: new ObjectId(postId) },
            { 
              $inc: { 'stats.viewsCount': 1 },
              $set: { updatedAt: new Date().toISOString() }
            },
            { session }
          )
        }
      })
      
      return true
    } finally {
      await session.endSession()
    }
  }

  /**
   * Initialize stats for a new post
   */
  async initializePostStats(postId: string): Promise<void> {
    const db = await this.getDb()
    
    await db.collection<ForumPost>('forumPosts').updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          stats: {
            likesCount: 0,
            bookmarksCount: 0,
            sharesCount: 0,
            viewsCount: 0,
            repliesCount: 0
          }
        }
      }
    )
  }

  /**
   * Get user interactions for specific posts (for UI state)
   */
  async getUserInteractions(userId: string, postIds: string[]): Promise<Set<string>> {
    const db = await this.getDb()
    const interactions = await db.collection<UserInteraction>('userInteractions').find({
      userId: userId,
      targetId: { $in: postIds },
      targetType: 'post'
    }).toArray()

    const interactionTypes = new Set<string>()
    interactions.forEach(interaction => {
      interactionTypes.add(interaction.interactionType)
    })

    return interactionTypes
  }

  /**
   * Get posts with embedded stats and user interaction state
   */
  async getPostsWithStats(
    filter: object = {},
    userId?: string,
    options: { skip?: number; limit?: number; sort?: object } = {}
  ): Promise<ForumPost[]> {
    const db = await this.getDb()
    
    // Get posts with embedded stats
    const posts = await db.collection<ForumPost>('forumPosts')
      .find(filter)
      .sort(options.sort as Record<string, 1 | -1> || { createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .toArray()

    if (!userId || posts.length === 0) {
      return posts
    }

    // Get user interactions for all posts
    const postIds = posts.map(post => post._id!.toString())
    const userInteractions = await this.getUserInteractionsForPosts(userId, postIds)

    // Add user interaction flags to posts
    return posts.map(post => ({
      ...post,
      isLikedByUser: userInteractions.likes.has(post._id!.toString()),
      isBookmarkedByUser: userInteractions.bookmarks.has(post._id!.toString())
    }))
  }

  /**
   * Get single post with stats and user interaction state
   */
  async getPostWithStats(postId: string, userId?: string): Promise<ForumPost | null> {
    const db = await this.getDb()
    
    const post = await db.collection<ForumPost>('forumPosts').findOne({
      _id: new ObjectId(postId)
    })

    if (!post || !userId) {
      return post
    }

    // Get user interactions
    const userInteractions = await this.getUserInteractionsForPosts(userId, [postId])

    return {
      ...post,
      interactions: {
        isLiked: userInteractions.likes.has(postId),
        isBookmarked: userInteractions.bookmarks.has(postId),
        isShared: false
      }
    }
  }

  /**
   * Helper to get user interactions organized by type
   */
  private async getUserInteractionsForPosts(
    userId: string, 
    postIds: string[]
  ): Promise<{ likes: Set<string>; bookmarks: Set<string> }> {
    const db = await this.getDb()
    const interactions = await db.collection<UserInteraction>('userInteractions').find({
      userId: userId,
      targetId: { $in: postIds },
      targetType: 'post',
      interactionType: { $in: ['like', 'bookmark'] }
    }).toArray()

    const likes = new Set<string>()
    const bookmarks = new Set<string>()

    interactions.forEach(interaction => {
      const postId = interaction.targetId.toString()
      if (interaction.interactionType === 'like') {
        likes.add(postId)
      } else if (interaction.interactionType === 'bookmark') {
        bookmarks.add(postId)
      }
    })

    return { likes, bookmarks }
  }

  /**
   * Clean up stats (remove orphaned interactions, fix inconsistencies)
   */
  async cleanupStats(): Promise<{ cleaned: number; errors: string[] }> {
    const db = await this.getDb()
    const errors: string[] = []
    let cleaned = 0

    try {
      // Remove interactions for non-existent posts
      const orphanedInteractions = await db.collection('userInteractions').aggregate([
        {
          $lookup: {
            from: 'forumPosts',
            localField: 'targetId',
            foreignField: '_id',
            as: 'post'
          }
        },
        {
          $match: {
            targetType: 'post',
            post: { $size: 0 }
          }
        }
      ]).toArray()

      for (const interaction of orphanedInteractions) {
        await db.collection('userInteractions').deleteOne({ _id: interaction._id })
        cleaned++
      }

      // Recalculate stats for posts that might be inconsistent
      const posts = await db.collection('forumPosts').find({}).toArray()
      
      for (const post of posts) {
        const actualStats = await this.calculateActualStats(post._id!.toString())
        const currentStats = post.stats

        // Check if stats need updating
        if (
          currentStats.likesCount !== actualStats.likesCount ||
          currentStats.bookmarksCount !== actualStats.bookmarksCount ||
          currentStats.sharesCount !== actualStats.sharesCount ||
          currentStats.viewsCount !== actualStats.viewsCount
        ) {
          await db.collection('forumPosts').updateOne(
            { _id: post._id },
            { $set: { stats: actualStats } }
          )
          cleaned++
        }
      }

    } catch (error) {
      errors.push(`Cleanup error: ${error}`)
    }

    return { cleaned, errors }
  }

  /**
   * Blog-specific methods (consistent with forum patterns)
   */
  
  /**
   * Handle blog post interaction with atomic stats update
   */
  async handleBlogInteraction(
    userId: string,
    postId: string,
    action: 'like' | 'bookmark' | 'share'
  ): Promise<DetailedInteractionResponse> {
    if (!userId || !postId || !action) {
      throw new Error('Invalid parameters: userId, postId, and action are required')
    }

    try {
      const db = await this.getDb()
      // Check current interaction state
      const existingInteraction = await db.collection<UserInteraction>('userInteractions').findOne({
        userId: userId,
        targetId: postId,
        targetType: 'blog',
        interactionType: action === 'bookmark' ? 'bookmark' : action
      })

      const isRemoving = !!existingInteraction
      const statField = `stats.${action === 'bookmark' ? 'bookmarksCount' : action + 'sCount'}`
      const increment = isRemoving ? -1 : 1

      // Start transaction for atomic operation
      const client = await clientPromise
      const session = client.startSession()
      
      try {
        await session.withTransaction(async () => {
          if (isRemoving) {
            // Remove interaction
            await db.collection('userInteractions').deleteOne(
              { _id: new ObjectId(existingInteraction._id) },
              { session }
            )
          } else {
            // Add interaction
            await db.collection<UserInteraction>('userInteractions').insertOne({
              _id: new ObjectId(),
              id: new ObjectId().toString(),
              userId: userId,
              targetId: postId,
              targetType: 'blog',
              interactionType: action === 'bookmark' ? 'bookmark' : action,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { session })
          }

          // Update blog post stats atomically
          const updateFields: Record<string, number> = {}
          updateFields[statField] = increment

          await db.collection('blogPosts').updateOne(
            { _id: new ObjectId(postId) },
            { 
              $inc: updateFields,
              $set: { updatedAt: new Date() }
            },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }

      // Get updated post with current stats
      const updatedPost = await db.collection('blogPosts').findOne(
        { _id: new ObjectId(postId) },
        { projection: { stats: 1 } }
      )

      // Verify the post exists
      if (!updatedPost) {
        throw new Error('Blog post not found')
      }

      // Get current user interactions for this post
      const userInteractions = await this.getUserBlogInteractions(userId, [postId])

      return {
        success: true,
        action: isRemoving ? 'removed' : 'added',
        currentState: !isRemoving,
        isNew: !isRemoving,
        stats: updatedPost.stats || {
          likesCount: 0,
          bookmarksCount: 0,
          sharesCount: 0,
          viewsCount: 0
        },
        interactions: {
          isLiked: userInteractions.has('like'),
          isBookmarked: userInteractions.has('bookmark'),
          isShared: action === 'share' ? !isRemoving : false
        }
      }
    } catch (error) {
      console.error('Blog stats interaction error:', error)
      throw new Error(`Failed to ${action} blog post: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Record blog view interaction (no toggle, just increment)
   */
  async recordBlogView(userId: string, postId: string): Promise<boolean> {
    const db = await this.getDb()

    // Check if user already viewed this post recently (last 24h)
    const recentView = await db.collection<UserInteraction>('userInteractions').findOne({
      userId: userId,
      targetId: postId,
      targetType: 'blog',
      interactionType: 'view',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    })

    if (recentView) {
      return false // Don't count duplicate views
    }

    // Start transaction
    const client = await getClientPromise()
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Use upsert to handle potential race conditions
        const result = await db.collection<UserInteraction>('userInteractions').updateOne(
          {
            userId: userId,
            targetId: postId,
            targetType: 'blog',
            interactionType: 'view'
          },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              id: new ObjectId().toString(),
              userId: userId,
              targetId: postId,
              targetType: 'blog',
              interactionType: 'view',
              createdAt: new Date().toISOString()
            },
            $set: {
              updatedAt: new Date().toISOString()
            }
          },
          { 
            upsert: true,
            session 
          }
        )

        // Only increment view count if this is a new view record
        if (result.upsertedCount > 0) {
          await db.collection('blogPosts').updateOne(
            { _id: new ObjectId(postId) },
            { 
              $inc: { 
                'stats.viewsCount': 1
              },
              $set: { updatedAt: new Date() }
            },
            { session }
          )
        }
      })
      
      return true
    } finally {
      await session.endSession()
    }
  }

  /**
   * Get user interactions for specific blog posts (for UI state)
   */
  async getUserBlogInteractions(userId: string, postIds: string[]): Promise<Set<string>> {
    const db = await this.getDb()
    const interactions = await db.collection<UserInteraction>('userInteractions').find({
      userId: userId,
      targetId: { $in: postIds },
      targetType: 'blog'
    }).toArray()

    const interactionTypes = new Set<string>()
    interactions.forEach(interaction => {
      interactionTypes.add(interaction.interactionType)
    })

    return interactionTypes
  }

  /**
   * Calculate actual stats from interactions
   */
  private async calculateActualStats(postId: string): Promise<ForumPost['stats']> {
    const db = await this.getDb()

    const [likesCount, bookmarksCount, sharesCount, viewsCount] = await Promise.all([
      db.collection('userInteractions').countDocuments({
        targetId: postId,
        targetType: 'post',
        interactionType: 'like'
      }),
      db.collection('userInteractions').countDocuments({
        targetId: postId,
        targetType: 'post',
        interactionType: 'bookmark'
      }),
      db.collection('userInteractions').countDocuments({
        targetId: postId,
        targetType: 'post',
        interactionType: 'share'
      }),
      db.collection('userInteractions').countDocuments({
        targetId: postId,
        targetType: 'post',
        interactionType: 'view'
      })
    ])

    // Count replies (assuming forumReplies collection exists)
    const repliesCount = await db.collection('forumReplies').countDocuments({
      postId: postId
    })

    return {
      likesCount,
      bookmarksCount,
      sharesCount,
      viewsCount,
      repliesCount
    }
  }

  /**
   * Handle wiki interaction with atomic stats update
   * Supports wiki-specific interactions like 'helpful'
   */
  async handleWikiInteraction(
    userId: string,
    guideId: string,
    action: 'like' | 'bookmark' | 'helpful' | 'share'
  ): Promise<DetailedInteractionResponse> {
    if (!userId || !guideId || !action) {
      throw new Error('Invalid parameters: userId, guideId, and action are required')
    }

    try {
      const db = await this.getDb()
      
      // Check current interaction state
      const existingInteraction = await db.collection<UserInteraction>('userInteractions').findOne({
        userId: userId,
        targetId: guideId,
        targetType: 'guide',
        interactionType: action === 'bookmark' ? 'bookmark' : action
      })

      const isRemoving = !!existingInteraction
      const statField = action === 'bookmark' ? 'stats.bookmarksCount' : 
                       action === 'helpful' ? 'stats.helpfulsCount' : 
                       `stats.${action}sCount`
      const increment = isRemoving ? -1 : 1

      // Start transaction for atomic operation
      const client = await clientPromise
      const session = client.startSession()
      
      try {
        await session.withTransaction(async () => {
          if (isRemoving) {
            // Remove interaction
            await db.collection('userInteractions').deleteOne(
              { _id: new ObjectId(existingInteraction._id) },
              { session }
            )
          } else {
            // Add interaction
            await db.collection<UserInteraction>('userInteractions').insertOne({
              _id: new ObjectId(),
              id: new ObjectId().toString(),
              userId: userId,
              targetId: guideId,
              targetType: 'guide',
              interactionType: action === 'bookmark' ? 'bookmark' : action,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { session })
          }

          // Update wiki guide stats atomically
          await db.collection('wikiGuides').updateOne(
            { _id: new ObjectId(guideId) },
            { 
              $inc: { [statField]: increment },
              $set: { updatedAt: new Date().toISOString() }
            },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }

      // Get updated guide with current stats
      const updatedGuide = await db.collection('wikiGuides').findOne(
        { _id: new ObjectId(guideId) },
        { projection: { stats: 1 } }
      )

      // Verify the guide exists
      if (!updatedGuide) {
        throw new Error('Guide not found')
      }

      // Get current user interactions for this guide
      const userInteractions = await this.getWikiUserInteractions(userId, [guideId])

      const result: DetailedInteractionResponse = {
        success: true,
        action: isRemoving ? 'removed' : 'added',
        currentState: !isRemoving,
        isNew: !isRemoving,
        stats: updatedGuide.stats || {
          likesCount: 0,
          bookmarksCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          helpfulsCount: 0
        },
        interactions: {
          isLiked: userInteractions.has('like'),
          isBookmarked: userInteractions.has('bookmark'),
          isShared: action === 'share' ? !isRemoving : false,
          isHelpful: userInteractions.has('helpful')
        }
      }

      // Broadcast real-time update to WebSocket subscribers
      try {
        // Get the guide slug for broadcasting (assuming it's available)
        const guide = await db.collection('wikiGuides').findOne(
          { _id: new ObjectId(guideId) },
          { projection: { slug: 1 } }
        )

        if (guide?.slug) {
          statsBroadcaster.broadcastStatsUpdate({
            contentType: 'wiki',
            contentId: guideId,
            slug: guide.slug,
            stats: result.stats,
            interactions: result.interactions,
            userId: userId
          })
        }
      } catch (broadcastError) {
        console.error('Failed to broadcast wiki stats update:', broadcastError)
        // Don't fail the main operation if broadcast fails
      }

      return result
    } catch (error) {
      console.error('Wiki stats interaction error:', error)
      throw new Error(`Failed to ${action} guide: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Record wiki view interaction (no toggle, just increment)
   */
  async recordWikiView(userId: string, guideId: string): Promise<boolean> {
    const db = await this.getDb()

    // Check if user already viewed this guide recently (last 24h)
    const recentView = await db.collection<UserInteraction>('userInteractions').findOne({
      userId: userId,
      targetId: guideId,
      targetType: 'guide',
      interactionType: 'view',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    })

    if (recentView) {
      return false // Don't count duplicate views
    }

    // Start transaction
    const client = await getClientPromise()
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Use upsert to handle potential race conditions
        const result = await db.collection<UserInteraction>('userInteractions').updateOne(
          {
            userId: userId,
            targetId: guideId,
            targetType: 'guide',
            interactionType: 'view'
          },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              id: new ObjectId().toString(),
              userId: userId,
              targetId: guideId,
              targetType: 'guide',
              interactionType: 'view',
              createdAt: new Date().toISOString()
            },
            $set: {
              updatedAt: new Date().toISOString()
            }
          },
          { 
            upsert: true,
            session 
          }
        )

        // Only increment view count if this is a new view record
        if (result.upsertedCount > 0) {
          await db.collection('wikiGuides').updateOne(
            { _id: new ObjectId(guideId) },
            { 
              $inc: { 'stats.viewsCount': 1 },
              $set: { updatedAt: new Date().toISOString() }
            },
            { session }
          )
        }
      })
      
      return true
    } finally {
      await session.endSession()
    }
  }

  /**
   * Record a dex monster view with duplicate detection
   */
  async recordDexView(userId: string, monsterId: string): Promise<boolean> {
    const db = await this.getDb()

    // Check if user already viewed this monster recently (last 24h)
    const recentView = await db.collection<UserInteraction>('userInteractions').findOne({
      userId: userId,
      targetId: monsterId,
      targetType: 'monster',
      interactionType: 'view',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    })

    if (recentView) {
      return false // Don't count duplicate views
    }

    // Start transaction
    const client = await getClientPromise()
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Use upsert to handle potential race conditions
        const result = await db.collection<UserInteraction>('userInteractions').updateOne(
          {
            userId: userId,
            targetId: monsterId,
            targetType: 'monster',
            interactionType: 'view'
          },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              id: new ObjectId().toString(),
              userId: userId,
              targetId: monsterId,
              targetType: 'monster',
              interactionType: 'view',
              createdAt: new Date().toISOString()
            },
            $set: {
              updatedAt: new Date().toISOString()
            }
          },
          { 
            upsert: true,
            session 
          }
        )

        // Only increment view count if this is a new view record
        if (result.upsertedCount > 0) {
          await db.collection('dexMonsters').updateOne(
            { _id: new ObjectId(monsterId) },
            { 
              $inc: { 'stats.viewsCount': 1 },
              $set: { updatedAt: new Date().toISOString() }
            },
            { session }
          )
        }
      })
      
      return true
    } finally {
      await session.endSession()
    }
  }

  /**
   * Get user interactions for specific wiki guides
   */
  private async getWikiUserInteractions(userId: string, guideIds: string[]): Promise<Set<string>> {
    const db = await this.getDb()
    const interactions = await db.collection<UserInteraction>('userInteractions').find({
      userId: userId,
      targetId: { $in: guideIds },
      targetType: 'guide'
    }).toArray()

    const interactionTypes = new Set<string>()
    interactions.forEach(interaction => {
      interactionTypes.add(interaction.interactionType)
    })

    return interactionTypes
  }

  // Convenience methods that map to the main interaction handlers
  async recordForumInteraction(
    userId: string,
    postId: string,
    action: 'like' | 'bookmark' | 'share'
  ): Promise<DetailedInteractionResponse> {
    return this.handleInteraction(userId, postId, action)
  }

  async recordBlogInteraction(
    userId: string,
    postId: string,
    action: 'like' | 'bookmark' | 'share'
  ): Promise<DetailedInteractionResponse> {
    return this.handleBlogInteraction(userId, postId, action)
  }

  async recordWikiInteraction(
    userId: string,
    guideId: string,
    action: 'like' | 'bookmark' | 'share' | 'helpful'
  ): Promise<DetailedInteractionResponse> {
    return this.handleWikiInteraction(userId, guideId, action)
  }
}

// Singleton instance
export const statsManager = new StatsManager()