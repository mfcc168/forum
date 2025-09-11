/**
 * Forum Database Access Layer
 * 
 * Uses embedded stats with atomic operations for optimal performance and reliability.
 */

import { ObjectId, Filter } from 'mongodb'
import { BaseDAL } from './base'
import { statsManager } from '@/lib/database/stats'
import { MongoForumPostSchema, type ForumPost } from '@/lib/database/schemas'
import { generateSlug, generateSlugWithCounter } from '@/lib/utils/slug'
import { handleDatabaseError } from '@/lib/utils/error-handler'
import { ReferentialIntegrityManager } from '@/lib/database/referential-integrity'
import { 
  createPostsAggregationPipeline, 
  createSingleForumPostPipeline 
} from '@/lib/database/aggregation-utils'
import { 
  ForumPostQueryBuilder, 
  calculatePagination, 
  createSingleDocumentMatch,
  createSlugMatch 
} from '@/lib/database/query-builder'
import type { 
  ForumCategory, 
  ForumReply,
  UserInteraction, 
  PostFilters,
  PaginatedResponse
} from '@/lib/types'
import type { ForumStats } from '@/lib/types/entities/stats'
import { FORUM_CATEGORIES } from '@/lib/config/forum-categories'

// MongoDB aggregation pipeline interfaces
interface MongoMatchConditions {
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>
  isDeleted?: { $ne: boolean }
  isLocked?: { $ne: boolean }
  status?: string
  categoryName?: { $in: string[] }
  tags?: { $in: string[] }
  'author.name'?: { $in: string[] }
  createdAt?: {
    $gte?: string
    $lte?: string
  }
}

interface MongoSortStage {
  'stats.likesCount'?: -1 | 1
  'stats.repliesCount'?: -1 | 1
  'stats.viewsCount'?: -1 | 1
  createdAt?: -1 | 1
  title?: -1 | 1
  'author.name'?: -1 | 1
}

interface MongoAggregationStage {
  $match?: MongoMatchConditions
  $sort?: MongoSortStage
  $skip?: number
  $limit?: number
}

// Concrete DAL implementations
class InteractionDAL extends BaseDAL<UserInteraction> {
  constructor() { super('userInteractions') }
  
  // Public method to access collection for upsert operations
  async getCollectionPublic() {
    return this.getCollection()
  }
}

class CategoryDAL extends BaseDAL<ForumCategory> {
  constructor() { super('forumCategories') }
}

export class ForumDAL extends BaseDAL<ForumPost> {
  private interactionsDAL: InteractionDAL
  private categoriesDAL: CategoryDAL

  constructor() {
    super('forumPosts')
    this.interactionsDAL = new InteractionDAL()
    this.categoriesDAL = new CategoryDAL()
  }

  /**
   * Get paginated forum posts with embedded stats
   */
  async getPosts(
    filters: PostFilters,
    pagination: { page: number; limit: number },
    userId?: string
  ): Promise<PaginatedResponse<ForumPost>> {
    try {
      const { page, limit } = pagination

      // Build filter and sort using query builder
      const queryBuilder = ForumPostQueryBuilder.fromFilters(filters)
      const filter = queryBuilder.buildFilter()
      const sort = queryBuilder.buildSort()

      // Get total count for pagination
      const total = await this.count(filter as Filter<ForumPost>)
      
      // Calculate pagination info
      const paginationInfo = calculatePagination(page, limit, total)

      // Use simplified aggregation pipeline (consistent with wiki pattern)
      const pipeline = createPostsAggregationPipeline(filter, sort, paginationInfo.skip, limit, userId)
      
      const rawPosts = await this.aggregate(pipeline)

      // Parse and validate MongoDB documents with Zod schema
      const posts = rawPosts.map(doc => MongoForumPostSchema.parse(doc))

      return {
        data: posts,
        pagination: paginationInfo
      }
    } catch (error) {
      handleDatabaseError(error, 'fetch forum posts')
    }
  }

  /**
   * Enhanced search for forum posts with advanced filtering and ranking
   */
  async searchPosts(searchParams: {
    query: string
    categories?: string[]
    tags?: string[]
    authors?: string[]
    status?: string
    dateRange?: { from?: Date; to?: Date }
    sortBy?: 'latest' | 'popular' | 'views' | 'replies'
    limit?: number
    offset?: number
  }): Promise<ForumPost[]> {
    try {
      const {
        query,
        categories,
        tags,
        authors,
        status = 'active',
        dateRange,
        sortBy = 'latest',
        limit = 20,
        offset = 0
      } = searchParams

      // Build search aggregation pipeline
      const pipeline: MongoAggregationStage[] = []

      // Match stage with search and filters
      const matchConditions: MongoMatchConditions = {}

      // Text search across title and content
      if (query) {
        matchConditions.$or = [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { excerpt: { $regex: query, $options: 'i' } }
        ]
      }

      // Status filter
      if (status === 'active') {
        matchConditions.isDeleted = { $ne: true }
        matchConditions.isLocked = { $ne: true }
      } else if (status !== 'all') {
        matchConditions.status = status
      }

      // Category filter
      if (categories && categories.length > 0) {
        matchConditions.categoryName = { $in: categories }
      }

      // Tags filter
      if (tags && tags.length > 0) {
        matchConditions.tags = { $in: tags }
      }

      // Author filter
      if (authors && authors.length > 0) {
        matchConditions['author.name'] = { $in: authors }
      }

      // Date range filter
      if (dateRange) {
        const dateFilter: { $gte?: string; $lte?: string } = {}
        if (dateRange.from) {
          dateFilter.$gte = dateRange.from.toISOString()
        }
        if (dateRange.to) {
          dateFilter.$lte = dateRange.to.toISOString()
        }
        if (Object.keys(dateFilter).length > 0) {
          matchConditions.createdAt = dateFilter
        }
      }

      pipeline.push({ $match: matchConditions })

      // Sort stage
      let sortStage: MongoSortStage = {}
      switch (sortBy) {
        case 'popular':
          sortStage = { 'stats.likesCount': -1, 'stats.repliesCount': -1 }
          break
        case 'views':
          sortStage = { 'stats.viewsCount': -1 }
          break
        case 'replies':
          sortStage = { 'stats.repliesCount': -1 }
          break
        default: // 'latest'
          sortStage = { createdAt: -1 }
      }

      pipeline.push({ $sort: sortStage })

      // Pagination
      if (offset > 0) {
        pipeline.push({ $skip: offset })
      }
      pipeline.push({ $limit: limit })

      // Execute search
      const results = await this.aggregate(pipeline)
      
      // Parse and validate results
      return results.map(doc => MongoForumPostSchema.parse(doc))

    } catch (error) {
      console.error('Forum search error:', error)
      handleDatabaseError(error, 'search forum posts')
    }
  }

  /**
   * Get single post with stats
   */
  async getPostWithStats(postId: string | ObjectId, userId?: string, includeAllStatuses = false): Promise<ForumPost | null> {
    try {
      const additionalFilters = includeAllStatuses ? {} : { status: 'published' }
      const matchStage = createSingleDocumentMatch(postId, additionalFilters)
      if (!matchStage) {
        return null // Invalid ObjectId
      }
      
      const pipeline = createSingleForumPostPipeline(matchStage, userId)
      const results = await this.aggregate(pipeline)
      const rawPost = results[0]
      
      if (!rawPost) {
        return null
      }
      
      // Parse and validate MongoDB documents with Zod schema
      return MongoForumPostSchema.parse(rawPost)
    } catch (error) {
      handleDatabaseError(error, 'fetch forum post by ID')
    }
  }

  /**
   * Create new forum post with automatic slug generation and stats initialization
   */
  async createPost(postData: Omit<ForumPost, '_id' | 'createdAt' | 'updatedAt' | 'stats' | 'slug'>): Promise<string> {
    try {
      // Generate unique slug from title
      const baseSlug = generateSlug(postData.title)
      let uniqueSlug = baseSlug
      let counter = 1
      
      // Ensure slug uniqueness by checking existing posts
      while (await this.findOne({ slug: uniqueSlug })) {
        uniqueSlug = generateSlugWithCounter(baseSlug, counter)
        counter++
      }
    
      const post: Omit<ForumPost, '_id'> = {
        ...postData,
        slug: uniqueSlug,
        // Initialize embedded stats (consistent with blog/wiki)
        stats: {
          likesCount: 0,
          bookmarksCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          repliesCount: 0
        },
        // Standardized timestamp fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await this.insertOne(post)
      return result.insertedId.toString()
    } catch (error) {
      handleDatabaseError(error, 'create forum post')
    }
  }

  /**
   * Get forum post by slug with stats and user interactions
   */
  async getPostBySlug(slug: string, userId?: string, includeAllStatuses = false): Promise<ForumPost | null> {
    try {
      const additionalFilters = includeAllStatuses ? {} : { status: 'published' }
      const matchStage = createSlugMatch(slug, additionalFilters)
      const pipeline = createSingleForumPostPipeline(matchStage, userId)
      const results = await this.aggregate(pipeline)
      const rawPost = results[0]
      
      if (!rawPost) {
        return null
      }
      
      // Parse and validate MongoDB document with Zod schema
      return MongoForumPostSchema.parse(rawPost)
    } catch (error) {
      console.error('Error in getPostBySlug:', error)
      throw error
    }
  }

  /**
   * Update post by slug
   */
  async updatePost(slug: string, updateData: Partial<Pick<ForumPost, 'title' | 'content' | 'tags' | 'status'>>): Promise<boolean> {
    const updateDoc: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    // Forum posts don't use publishedAt like blog posts
    
    // If title is being updated, regenerate slug
    if (updateData.title) {
      const baseSlug = generateSlug(updateData.title)
      let newSlug = baseSlug
      let counter = 1
      
      // Ensure new slug is unique (excluding current post)
      while (await this.findOne({ slug: newSlug }) && newSlug !== slug) {
        newSlug = generateSlugWithCounter(baseSlug, counter)
        counter++
      }
      
      updateDoc.slug = newSlug
    }
    
    const result = await this.updateOne(
      { slug },
      { $set: updateDoc }
    )
    
    return result.modifiedCount > 0
  }

  /**
   * Delete post by slug (soft delete with cascading cleanup)
   */
  async deletePost(slug: string): Promise<boolean> {
    try {
      // First get the post to find its ID
      const post = await this.findOne({ slug })
      if (!post) {
        return false
      }

      // Perform soft delete of the post
      const result = await this.updateOne(
        { slug },
        { 
          $set: { 
            status: 'archived',
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      )

      if (result.modifiedCount > 0) {
        try {
          // Clean up all foreign key references
          await ReferentialIntegrityManager.cleanupForumPostReferences(post.id, this)
        } catch (cleanupError) {
          console.error('Error during cleanup, but post deletion succeeded:', cleanupError)
          // Don't fail the deletion if cleanup fails
        }
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error in deletePost:', error)
      return false
    }
  }

  /**
   * Record user interaction
   */
  async recordInteraction(
    userId: string,
    targetId: string,
    interactionType: 'like' | 'bookmark' | 'share' | 'view'
  ): Promise<{ isNew: boolean; currentState: boolean }> {
    // Handle view interactions separately (no toggle behavior)
    if (interactionType === 'view') {
      const isNew = await statsManager.recordForumView(userId, targetId)
      return { isNew, currentState: true }
    }
    
    const result = await statsManager.handleInteraction(userId, targetId, interactionType as 'like' | 'bookmark' | 'share')
    
    // Transform InteractionResponse to expected format
    const actionType = interactionType === 'bookmark' ? 'isBookmarked' : 
                      interactionType === 'like' ? 'isLiked' : 'isShared'
    
    return {
      isNew: result.interactions[actionType] === true,
      currentState: result.interactions[actionType] || false
    }
  }



  /**
   * Get all active categories with post counts
   */
  async getCategories(): Promise<ForumCategory[]> {
    await this.init()
    
    // Get actual post counts for each category
    const postCounts = await this.db
      .collection('forumPosts')
      .aggregate([
        { $match: { status: 'published', isDeleted: { $ne: true }, categoryName: { $ne: null } } },
        {
          $group: {
            _id: '$categoryName',
            postCount: { $sum: 1 }
          }
        }
      ])
      .toArray()

    // Create a map of category -> postCount
    const countMap = postCounts.reduce((acc, item) => {
      acc[item._id] = item.postCount
      return acc
    }, {} as Record<string, number>)

    // Get base categories and enrich with post counts
    const baseCategories = await this.categoriesDAL.find({ isActive: true }, { sort: { order: 1 } })
    
    // If no categories in database, use static config
    if (baseCategories.length === 0) {
      return FORUM_CATEGORIES
        .sort((a, b) => a.order - b.order)
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          description: cat.description,
          isActive: true,
          order: cat.order,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            postsCount: countMap[cat.name] || 0,
            viewsCount: 0
          }
        }))
    }

    // Enrich existing categories with post counts
    return baseCategories.map(cat => ({
      ...cat,
      stats: {
        ...cat.stats,
        postsCount: countMap[cat.name] || 0
      }
    }))
  }

  /**
   * Increment view count for anonymous users
   */
  async incrementForumViewCount(id: string): Promise<void> {
    await this.init()
    await this.updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { 'stats.viewsCount': 1 },
        $set: { updatedAt: new Date().toISOString() }
      }
    )
  }

  /**
   * Get forum statistics
   */
  async getStats(): Promise<ForumStats> {
    // Initialize database connection
    await this.init()
    
    // Get forum statistics using optimized queries
    const collection = await this.getCollection()
    const [totalTopics, totalViews, totalLikes, totalShares, totalMembers, onlineMembers, categories] = await Promise.all([
      // Count active forum posts (topics)
      this.count({ status: 'published' } as Filter<ForumPost>),
      
      // Sum total views from all published posts
      collection.aggregate<{ total: number }>([
        { $match: { status: 'published', isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$stats.viewsCount' } } }
      ]).toArray().then((result) => result[0]?.total || 0),
      
      // Sum total likes from all published posts
      collection.aggregate<{ total: number }>([
        { $match: { status: 'published', isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$stats.likesCount' } } }
      ]).toArray().then((result) => result[0]?.total || 0),
      
      // Sum total shares from all published posts
      collection.aggregate<{ total: number }>([
        { $match: { status: 'published', isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$stats.sharesCount' } } }
      ]).toArray().then((result) => result[0]?.total || 0),
      
      // Count total active users
      this.db.collection('users').countDocuments({ status: 'active' }),
      
      // Count online users (active in last 15 minutes)
      this.db.collection('users').countDocuments({ 
        status: 'active', 
        lastActive: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      }),
      
      // Get categories
      this.categoriesDAL.find({ isActive: true }, { sort: { order: 1 } })
    ])

    // Count total replies
    const totalReplies = await this.db.collection('forumReplies').countDocuments({ 
      isDeleted: { $ne: true } 
    })

    return {
      // Base StatsResponse fields
      totalPosts: totalTopics,
      totalViews,
      totalLikes,
      totalShares,
      totalUsers: totalMembers,
      activeUsers: onlineMembers,
      categoriesCount: categories.length,
      // ForumStats-specific fields
      totalTopics,
      totalReplies,
      totalMembers,
      onlineMembers,
      categories: categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        postsCount: cat.stats?.postsCount || 0,
        order: cat.order
      })),
      popularPosts: [],
      recentPosts: []
    }
  }

  /**
   * Get replies for a specific post
   */
  async getReplies(postId: string, pagination: { page: number; limit: number } = { page: 1, limit: 50 }): Promise<PaginatedResponse<ForumReply>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const pipeline = [
      { $match: { postId: new ObjectId(postId), isDeleted: false } },
      { $sort: { createdAt: 1 } },
      { $skip: skip },
      { $limit: limit },
      // Lookup author details
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      // Transform to consistent format
      {
        $project: {
          id: { $toString: '$_id' },
          postId: { $toString: '$postId' },
          content: 1,
          replyToId: { $toString: '$replyToId' },
          createdAt: { $dateToString: { date: '$createdAt' } },
          updatedAt: { $dateToString: { date: '$updatedAt' } },
          stats: {
            likesCount: { $ifNull: ['$stats.likesCount', 0] },
            bookmarksCount: { $ifNull: ['$stats.bookmarksCount', 0] },
            sharesCount: { $ifNull: ['$stats.sharesCount', 0] },
            viewsCount: { $ifNull: ['$stats.viewsCount', 0] }
          },
          author: {
            $let: {
              vars: { authorData: { $arrayElemAt: ['$authorDetails', 0] } },
              in: {
                id: { $toString: '$$authorData._id' },
                name: { $ifNull: ['$$authorData.username', '$authorName'] },
                avatar: { $ifNull: ['$$authorData.avatar', '$authorAvatar'] }
              }
            }
          }
        }
      }
    ]

    const [rawReplies, totalCount] = await Promise.all([
      this.getNamedCollection('forumReplies').then(col => col.aggregate<ForumReply>(pipeline).toArray()),
      this.getNamedCollection('forumReplies').then(col => col.countDocuments({ postId: new ObjectId(postId), isDeleted: false }))
    ])

    return {
      data: rawReplies,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: skip + rawReplies.length < totalCount,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Create a new reply
   */
  async createReply(replyData: {
    postId: string
    content: string
    authorId: string
    authorName: string
    authorAvatar?: string
    replyToId?: string
  }): Promise<string> {
    // Verify post exists and is not locked
    const post = await this.findById(replyData.postId)
    if (!post) {
      throw new Error('Post not found')
    }

    // isLocked validation handled at API route level

    const newReply = {
      postId: new ObjectId(replyData.postId),
      author: new ObjectId(replyData.authorId),
      authorName: replyData.authorName,
      authorAvatar: replyData.authorAvatar,
      content: replyData.content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      replyToId: replyData.replyToId ? new ObjectId(replyData.replyToId) : undefined,
      stats: {
        likesCount: 0,
        bookmarksCount: 0,
        sharesCount: 0,
        viewsCount: 0
      },
      isDeleted: false
    }

    // Insert the reply
    const collection = await this.getNamedCollection('forumReplies')
    const result = await collection.insertOne(newReply)

    // Update post reply count and last reply info using embedded stats
    await this.updateById(replyData.postId, {
      $inc: { 'stats.repliesCount': 1 },
      $set: {
        lastReplyDate: new Date(),
        lastReplyAuthor: replyData.authorId,
        updatedAt: new Date().toISOString()
      }
    })

    return result.insertedId.toString()
  }

  /**
   * Helper method to get collection by name
   */
  private async getNamedCollection(collectionName: string = 'forumPosts') {
    await this.init()
    return this.db!.collection(collectionName)
  }

  /**
   * Public method to get forum posts collection (consistent with blog/wiki)
   */
  async getCollectionPublic() {
    return this.getCollection()
  }

  /**
   * Public method to access interactions collection for upsert operations (consistent with blog/wiki)
   */
  async getInteractionsCollection() {
    return this.interactionsDAL.getCollectionPublic()
  }

  /**
   * Update a reply
   */
  async updateReply(replyId: string, updateData: { content: string }): Promise<boolean> {
    const collection = await this.getNamedCollection('forumReplies')
    
    // Verify reply exists and is not deleted
    const reply = await collection.findOne({ 
      _id: new ObjectId(replyId), 
      isDeleted: false 
    })
    
    if (!reply) {
      return false
    }
    
    // Update the reply
    const result = await collection.updateOne(
      { _id: new ObjectId(replyId) },
      {
        $set: {
          content: updateData.content.trim(),
          updatedAt: new Date()
        }
      }
    )
    
    return result.modifiedCount > 0
  }

  /**
   * Delete a reply (soft delete with cascading cleanup)
   */
  async deleteReply(replyId: string): Promise<boolean> {
    try {
      const collection = await this.getNamedCollection('forumReplies')
      
      // Get reply details first for post stats update
      const reply = await collection.findOne({ 
        _id: new ObjectId(replyId), 
        isDeleted: false 
      })
      
      if (!reply) {
        return false
      }
      
      // Soft delete the reply
      const deleteResult = await collection.updateOne(
        { _id: new ObjectId(replyId) },
        { 
          $set: { 
            isDeleted: true, 
            deletedAt: new Date(),
            updatedAt: new Date() 
          } 
        }
      )
      
      if (deleteResult.modifiedCount > 0) {
        // Update post reply count using embedded stats
        await this.updateById(reply.postId.toString(), {
          $inc: { 'stats.repliesCount': -1 },
          $set: { updatedAt: new Date().toISOString() }
        })
        
        // Clean up all foreign key references for this reply
        await ReferentialIntegrityManager.cleanupForumReplyReferences(replyId, this)
        
        return true
      }
      
      return false
    } catch (error) {
      handleDatabaseError(error, 'delete forum reply with cleanup')
      return false
    }
  }

  /**
   * Get a single reply by ID
   */
  async getReplyById(replyId: string): Promise<ForumReply | null> {
    const collection = await this.getNamedCollection('forumReplies')
    
    const pipeline = [
      { $match: { _id: new ObjectId(replyId), isDeleted: false } },
      // Lookup author details
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      // Transform to consistent format
      {
        $project: {
          id: { $toString: '$_id' },
          postId: { $toString: '$postId' },
          content: 1,
          author: '$author',
          authorName: 1,
          authorAvatar: 1,
          replyToId: { $toString: '$replyToId' },
          createdAt: { $dateToString: { date: '$createdAt' } },
          updatedAt: { $dateToString: { date: '$updatedAt' } },
          stats: {
            likesCount: { $ifNull: ['$stats.likesCount', 0] },
            bookmarksCount: { $ifNull: ['$stats.bookmarksCount', 0] },
            sharesCount: { $ifNull: ['$stats.sharesCount', 0] },
            viewsCount: { $ifNull: ['$stats.viewsCount', 0] }
          },
          authorDetails: {
            $let: {
              vars: { authorData: { $arrayElemAt: ['$authorDetails', 0] } },
              in: {
                id: { $toString: '$$authorData._id' },
                name: { $ifNull: ['$$authorData.username', '$authorName'] },
                avatar: { $ifNull: ['$$authorData.avatar', '$authorAvatar'] }
              }
            }
          }
        }
      }
    ]

    const results = await collection.aggregate<ForumReply>(pipeline).toArray()
    return results[0] || null
  }

  /**
   * Helper method for aggregation on different collections
   */
  async aggregateQuery(pipeline: object[]): Promise<unknown[]> {
    const collection = await this.getNamedCollection('forumPosts')
    return await collection.aggregate(pipeline).toArray()
  }

  /**
   * Public method to access named collections (for referential integrity)
   */
  async getNamedCollectionPublic(collectionName: string) {
    return this.getNamedCollection(collectionName)
  }
}