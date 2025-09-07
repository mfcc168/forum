/**
 * Wiki Database Access Layer
 * 
 * Manages wiki guides with embedded stats and user interactions.
 * Follows the same patterns as ForumDAL for consistency.
 */

import { ObjectId, Filter } from 'mongodb'
import { BaseDAL } from './base'
import { MongoWikiGuideSchema, type WikiGuide } from '@/lib/database/schemas'
import { generateSlug, generateSlugWithCounter } from '@/lib/utils/slug'
import { statsManager } from '@/lib/database/stats'
import { handleDatabaseError } from '@/lib/utils/error-handler'
import { ReferentialIntegrityManager } from '@/lib/database/referential-integrity'
import { 
  createWikiGuidesAggregationPipeline, 
  createSingleWikiGuidePipeline 
} from '@/lib/database/aggregation-utils'
import { 
  WikiGuideQueryBuilder,
  type WikiGuideFilters,
  calculatePagination,
  createSingleDocumentMatch,
  createSlugMatch 
} from '@/lib/database/query-builder'
import type { 
  WikiCategory, 
  WikiStats,
  UserInteraction,
  PaginatedResponse
} from '@/lib/types'

// MongoDB aggregation pipeline interfaces
interface MongoMatchConditions {
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>
  status?: string | { $in: string[] }
  category?: string | { $in: string[] }
  difficulty?: string | { $in: string[] }
  tags?: { $in: string[] }
  'author.name'?: { $in: string[] }
  createdAt?: {
    $gte?: string
    $lte?: string
  }
}

interface MongoSortStage {
  'stats.likesCount'?: -1 | 1
  'stats.viewsCount'?: -1 | 1
  'stats.helpfulCount'?: -1 | 1
  difficulty?: -1 | 1
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

// Types for wiki operations
export interface WikiFilters {
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  status?: 'draft' | 'published' | 'archived'
  author?: string
  tags?: string[]
  search?: string
}

// Concrete DAL implementations (consistent with blog/forum pattern)
class WikiInteractionDAL extends BaseDAL<UserInteraction> {
  constructor() { super('userInteractions') }
  
  // Public method to access collection for upsert operations
  async getCollectionPublic() {
    return this.getCollection()
  }
}

class WikiCategoryDAL extends BaseDAL<WikiCategory> {
  constructor() { super('wikiCategories') }
}

export class WikiDAL extends BaseDAL<WikiGuide> {
  private interactionsDAL: WikiInteractionDAL
  private categoriesDAL: WikiCategoryDAL

  constructor() {
    super('wikiGuides')
    this.interactionsDAL = new WikiInteractionDAL()
    this.categoriesDAL = new WikiCategoryDAL()
  }

  /**
   * Get paginated wiki guides with embedded stats
   */
  async getGuides(
    filters: WikiFilters,
    pagination: { page: number; limit: number },
    userId?: string
  ): Promise<PaginatedResponse<WikiGuide>> {
    try {
      const { page, limit } = pagination

      // Build filter and sort using query builder
      const wikiFilters: WikiGuideFilters = {
        category: filters.category,
        difficulty: filters.difficulty,
        status: filters.status,
        author: filters.author,
        tags: filters.tags,
        search: filters.search
      }
      const queryBuilder = WikiGuideQueryBuilder.fromFilters(wikiFilters)
      const filter = queryBuilder.buildFilter()
      const sort = queryBuilder.buildSort()

      // Get total count for pagination  
      const total = await this.count(filter as Filter<WikiGuide>)
      
      // Calculate pagination info
      const paginationInfo = calculatePagination(page, limit, total)

      // Use simplified aggregation pipeline
      const pipeline = createWikiGuidesAggregationPipeline(filter, sort, paginationInfo.skip, limit, userId)
      const rawGuides = await this.aggregate(pipeline)

      // Parse and validate MongoDB documents with Zod schema
      const guides = rawGuides.map(doc => MongoWikiGuideSchema.parse(doc))

      return {
        data: guides,
        pagination: paginationInfo
      }
    } catch (error) {
      handleDatabaseError(error, 'fetch wiki guides')
    }
  }

  /**
   * Enhanced search for wiki guides with advanced filtering and ranking
   */
  async searchGuides(searchParams: {
    query: string
    categories?: string[]
    difficulty?: string
    tags?: string[]
    authors?: string[]
    status?: string
    dateRange?: { from?: Date; to?: Date }
    sortBy?: 'latest' | 'popular' | 'views'
    limit?: number
    offset?: number
  }): Promise<WikiGuide[]> {
    try {
      const {
        query,
        categories,
        difficulty,
        tags,
        authors,
        status = 'published',
        dateRange,
        sortBy = 'latest',
        limit = 20,
        offset = 0
      } = searchParams

      // Build search aggregation pipeline
      const pipeline: MongoAggregationStage[] = []

      // Match stage with search and filters
      const matchConditions: MongoMatchConditions = {}

      // Text search across title, content, and excerpt
      if (query) {
        matchConditions.$or = [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { excerpt: { $regex: query, $options: 'i' } }
        ]
      }

      // Status filter
      matchConditions.status = status === 'all' ? { $in: ['published', 'draft', 'archived'] } : status

      // Category filter
      if (categories && categories.length > 0) {
        matchConditions.category = { $in: categories }
      }

      // Difficulty filter
      if (difficulty) {
        matchConditions.difficulty = difficulty
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
          sortStage = { 'stats.likesCount': -1, 'stats.helpfulCount': -1 }
          break
        case 'views':
          sortStage = { 'stats.viewsCount': -1 }
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
      return results.map(doc => MongoWikiGuideSchema.parse(doc))

    } catch (error) {
      console.error('Wiki search error:', error)
      handleDatabaseError(error, 'search wiki guides')
    }
  }

  /**
   * Get single guide with stats
   */
  async getGuideWithStats(guideId: string | ObjectId, userId?: string, includeAllStatuses = false): Promise<WikiGuide | null> {
    try {
      const additionalFilters = includeAllStatuses ? {} : { status: 'published' }
      const matchStage = createSingleDocumentMatch(guideId, additionalFilters)
      if (!matchStage) {
        return null // Invalid ObjectId
      }
      
      const pipeline = createSingleWikiGuidePipeline(matchStage, userId)
      const rawGuides = await this.aggregate(pipeline)
      const rawGuide = rawGuides[0]
      
      if (!rawGuide) {
        return null
      }
      
      // Parse and validate MongoDB document with Zod schema
      return MongoWikiGuideSchema.parse(rawGuide)
    } catch (error) {
      handleDatabaseError(error, 'fetch wiki guide by ID')
    }
  }

  /**
   * Get single guide by slug with user interactions
   */
  async getGuideBySlug(slug: string, userId?: string, includeAllStatuses = false): Promise<WikiGuide | null> {
    try {
      const additionalFilters = includeAllStatuses ? {} : { status: 'published' }
      const matchStage = createSlugMatch(slug, additionalFilters)
      const pipeline = createSingleWikiGuidePipeline(matchStage, userId)
      
      const rawGuides = await this.aggregate(pipeline)
      const rawGuide = rawGuides[0] || null

      if (!rawGuide) {
        return null
      }

      // Parse and validate MongoDB documents with Zod schema
      const guide = MongoWikiGuideSchema.parse(rawGuide)

      // Note: View count increment is handled in the API route to avoid double counting
      return guide
    } catch (error) {
      handleDatabaseError(error, 'fetch wiki guide by slug')
    }
  }

  /**
   * Create new wiki guide with slug uniqueness check (consistent with blog/forum pattern)
   */
  async createGuide(guideData: Omit<WikiGuide, '_id' | 'createdAt' | 'updatedAt' | 'stats' | 'slug'>): Promise<string> {
    try {
      // Generate unique slug from title
      const baseSlug = generateSlug(guideData.title)
      let uniqueSlug = baseSlug
      let counter = 1
      
      // Ensure slug uniqueness by checking existing guides
      while (await this.findOne({ slug: uniqueSlug })) {
        uniqueSlug = generateSlugWithCounter(baseSlug, counter)
        counter++
      }
      
      // Extract plain text from content for search
      const plainText = guideData.content ? guideData.content.replace(/<[^>]*>/g, '').trim() : ''
    
      const guide: Omit<WikiGuide, '_id'> = {
        ...guideData,
        slug: uniqueSlug, // Use the unique slug
        // Ensure required fields have defaults
        excerpt: guideData.excerpt || plainText.substring(0, 200),
        tags: guideData.tags || [],
        // Initialize embedded stats (consistent with blog/forum)
        stats: {
          viewsCount: 0,
          likesCount: 0,
          bookmarksCount: 0,
          sharesCount: 0,
          helpfulsCount: 0
        },
        // Standardized timestamp fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await this.insertOne(guide)
      
      // Update category guide count
      if (guideData.category) {
        await this.categoriesDAL.updateOne(
          { slug: guideData.category },
          { 
            $inc: { guideCount: 1 },
            $set: { lastUpdated: new Date() }
          }
        )
      }

      return result.insertedId.toString()
    } catch (error) {
      handleDatabaseError(error, 'create wiki guide')
    }
  }

  /**
   * Update wiki guide by slug (consistent with blog pattern)
   */
  async updateGuide(
    slug: string, 
    updateData: Partial<Pick<WikiGuide, 'title' | 'content' | 'excerpt' | 'category' | 'difficulty' | 'tags' | 'status'>>,
    userId: string
  ): Promise<boolean> {
    const updateDoc: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    // If content changed, update review info
    if (updateData.content || updateData.title) {
      updateDoc.lastReviewDate = new Date().toISOString()
      updateDoc.reviewedBy = userId
    }

    // Wiki guides don't use publishedAt like blog posts

    const result = await this.updateOne(
      { slug },
      { 
        $set: updateDoc,
        $inc: { version: 1 }
      }
    )
    
    return result.modifiedCount > 0
  }

  /**
   * Delete wiki guide by slug (soft delete with cascading cleanup)
   */
  async deleteGuide(slug: string): Promise<boolean> {
    try {
      // First get the guide to find its ID
      const guide = await this.findOne({ slug })
      if (!guide) {
        return false
      }

      // Perform soft delete of the guide
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
          await ReferentialIntegrityManager.cleanupWikiGuideReferences(guide.id, this)
        } catch (cleanupError) {
          console.error('Error during cleanup, but guide deletion succeeded:', cleanupError)
          // Don't fail the deletion if cleanup fails
        }
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error in deleteGuide:', error)
      return false
    }
  }

  /**
   * Record user interaction (like, bookmark, helpful, etc.) using statsManager
   */
  async recordInteraction(
    userId: string,
    targetId: string,
    interactionType: 'like' | 'bookmark' | 'helpful' | 'share' | 'view'
  ) {
    // Handle views separately as they don't toggle
    if (interactionType === 'view') {
      const isNew = await statsManager.recordWikiView(userId, targetId)
      return { isNew, action: 'added', currentState: true }
    }
    
    // Handle other interactions using statsManager
    const result = await statsManager.handleWikiInteraction(
      userId, 
      targetId, 
      interactionType as 'like' | 'bookmark' | 'helpful' | 'share'
    )
    
    // Transform statsManager response to match expected interface
    const isLiked = result.interactions?.isLiked || false
    const isBookmarked = result.interactions?.isBookmarked || false
    const isHelpful = result.interactions?.isHelpful || false
    const isShared = result.interactions?.isShared || false
    
    let currentState = false
    switch (interactionType) {
      case 'like': currentState = isLiked; break
      case 'bookmark': currentState = isBookmarked; break
      case 'helpful': currentState = isHelpful; break
      case 'share': currentState = isShared; break
    }
    
    return { 
      isNew: currentState, 
      action: currentState ? 'added' : 'removed',
      currentState,
      stats: result.stats
    }
  }

  /**
   * Get wiki categories
   */
  async getCategories(): Promise<WikiCategory[]> {
    return await this.categoriesDAL.find(
      { isActive: true },
      { sort: { order: 1 } }
    )
  }

  /**
   * Get wiki statistics
   */
  async getStats(): Promise<WikiStats> {
    const [
      totalViews,
      categories,
      popularGuides,
      recentlyUpdated
    ] = await Promise.all([
      this.aggregate<{ total: number }>([
        { $match: { status: 'published' } },
        { $group: { _id: null, total: { $sum: '$stats.viewsCount' } } }
      ]).then((result) => result[0]?.total || 0),
      this.categoriesDAL.find({ isActive: true }, { sort: { order: 1 } }),
      (async () => {
        const col = await this.getCollection()
        return col.find(
          { status: 'published' },
          { 
            sort: { 'stats.viewsCount': -1 },
            limit: 5,
            projection: { title: 1, slug: 1, 'stats.viewsCount': 1, difficulty: 1 }
          }
        ).toArray()
      })(),
      (async () => {
        const col = await this.getCollection()
        return col.find(
          { status: 'published' },
          { 
            sort: { updatedAt: -1 },
            limit: 5,
            projection: { title: 1, slug: 1, updatedAt: 1, difficulty: 1, createdAt: 1 }
          }
        ).toArray()
      })()
    ])

    const collection = await this.getCollection()
    const guidesCount = await collection.countDocuments({ status: 'published' })
    const authors = await collection.distinct('author', { status: 'published' })
    const authorsCount = authors.length
    
    // Build guides count by category
    const guidesCountByCategory: Record<string, number> = {}
    for (const category of categories) {
      guidesCountByCategory[category.slug] = category.stats?.postsCount || 0
    }

    // Build guides count by difficulty
    const difficultyAggregation = await this.aggregate<{ _id: string; count: number }>([
      { $match: { status: 'published' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ])
    
    const guidesCountByDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    }
    
    for (const result of difficultyAggregation) {
      if (result._id && ['beginner', 'intermediate', 'advanced'].includes(result._id)) {
        guidesCountByDifficulty[result._id as 'beginner' | 'intermediate' | 'advanced'] = result.count
      }
    }

    // Aggregate total likes and shares from all guides
    const statsAggregation = await this.aggregate<{
      _id: null,
      totalLikes: number,
      totalShares: number,
      totalHelpful: number,
      totalRatings: number,
      sumRatings: number
    }>([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $ifNull: ['$stats.likesCount', 0] } },
          totalShares: { $sum: { $ifNull: ['$stats.sharesCount', 0] } },
          totalHelpful: { $sum: { $ifNull: ['$stats.helpfulsCount', 0] } },
          totalRatings: { $sum: { $ifNull: ['$stats.totalRatings', 0] } },
          sumRatings: { $sum: { $multiply: [{ $ifNull: ['$stats.averageRating', 0] }, { $ifNull: ['$stats.totalRatings', 1] }] } }
        }
      }
    ])
    
    const aggregatedStats = statsAggregation[0] || { totalLikes: 0, totalShares: 0, totalHelpful: 0, totalRatings: 0, sumRatings: 0 }
    const averageRating = aggregatedStats.totalRatings > 0 ? aggregatedStats.sumRatings / aggregatedStats.totalRatings : 0

    return {
      // Base StatsResponse properties
      totalPosts: guidesCount,
      totalViews,
      totalLikes: aggregatedStats.totalLikes,
      totalShares: aggregatedStats.totalShares,
      totalUsers: authorsCount,
      activeUsers: authorsCount, // Active users would require user activity tracking
      categoriesCount: categories.length,
      
      // WikiStats-specific properties
      totalGuides: guidesCount,
      totalDrafts: await this.count({ status: 'draft' as const, isDeleted: { $ne: true } }),
      averageHelpfulRating: Math.round(averageRating * 10) / 10,
      guidesCountByDifficulty,
      categories: categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        postsCount: cat.stats?.postsCount || 0,
        order: cat.order
      })),
      popularPosts: popularGuides.map((guide) => ({
        title: guide.title,
        slug: guide.slug,
        viewsCount: guide.stats?.viewsCount || 0,
        helpfulsCount: guide.stats?.helpfulsCount || 0,
        difficulty: guide.difficulty
      })),
      recentPosts: recentlyUpdated.map((guide) => ({
        title: guide.title,
        slug: guide.slug,
        viewsCount: guide.stats?.viewsCount || 0,
        difficulty: guide.difficulty,
        createdAt: guide.createdAt || guide.updatedAt
      }))
    }
  }

  /**
   * Increment view count for anonymous users (direct stats update)
   */
  async incrementWikiViewCount(id: string): Promise<void> {
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
   * Public method to get wiki guides collection (consistent with blog/forum)
   */
  async getCollectionPublic() {
    return this.getCollection()
  }

  /**
   * Public method to access named collections (for referential integrity)
   */
  async getNamedCollectionPublic(collectionName: string) {
    await this.init()
    return this.db!.collection(collectionName)
  }
}