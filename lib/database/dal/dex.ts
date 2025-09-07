/**
 * Dex (Monster) Database Access Layer
 * 
 * Manages monster data with embedded stats and user interactions.
 * Follows the same patterns as WikiDAL for consistency.
 */

import { ObjectId, Filter } from 'mongodb'
import { BaseDAL } from './base'
import { MongoDexMonsterSchema, type DexMonster } from '@/lib/schemas/dex'
import { generateSlug, generateSlugWithCounter } from '@/lib/utils/slug'
import { statsManager } from '@/lib/database/stats'
import { handleDatabaseError } from '@/lib/utils/error-handler'
import { ReferentialIntegrityManager } from '@/lib/database/referential-integrity'
import type { 
  DexCategory, 
  DexStats,
  UserInteraction,
  PaginatedResponse,
  DexFilters as DexFiltersType,
  UserRef,
  MonsterDrop,
  SpawningInfo
} from '@/lib/types'

// Create monster data interface - matches the createMonsterSchema exactly
interface CreateMonsterData {
  name: string
  description: string
  excerpt?: string // Optional in schema
  category: string
  modelPath: string
  behaviors?: string[] // Default in schema
  drops?: MonsterDrop[] // Default in schema
  spawning: SpawningInfo
  tags?: string[] // Default in schema
  status?: 'draft' | 'published' // Default in schema
  stats: {
    health: number
    damage: number
    speed: number
    xpDrop: number
  }
  author: UserRef
}

// MongoDB aggregation pipeline interfaces
interface MongoMatchConditions {
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>
  status?: string | { $in: string[] }
  category?: string | { $in: string[] }
  tags?: { $in: string[] }
  'author.name'?: { $in: string[] }
  'spawning.worlds'?: { $in: string[] }
  'spawning.biomes'?: { $in: string[] }
  'spawning.structures'?: { $in: string[] }
  'spawning.spawnRate'?: string | { $in: string[] }
  createdAt?: {
    $gte?: string
    $lte?: string
  }
}

interface MongoSortStage {
  'stats.likesCount'?: -1 | 1
  'stats.viewsCount'?: -1 | 1
  createdAt?: -1 | 1
  name?: -1 | 1
  'author.name'?: -1 | 1
}

interface MongoAggregationStage {
  $match?: MongoMatchConditions
  $sort?: MongoSortStage
  $skip?: number
  $limit?: number
}

// Concrete DAL implementations (consistent with wiki/blog/forum pattern)
class DexInteractionDAL extends BaseDAL<UserInteraction> {
  constructor() { super('userInteractions') }
  
  // Public method to access collection for upsert operations
  async getCollectionPublic() {
    return this.getCollection()
  }
}

class DexCategoryDAL extends BaseDAL<DexCategory> {
  constructor() { super('dexCategories') }
}

export class DexDAL extends BaseDAL<DexMonster> {
  private interactionsDAL: DexInteractionDAL
  private categoriesDAL: DexCategoryDAL

  constructor() {
    super('dexMonsters')
    this.interactionsDAL = new DexInteractionDAL()
    this.categoriesDAL = new DexCategoryDAL()
  }

  /**
   * Get paginated dex monsters with embedded stats
   */
  async getMonsters(
    filters: DexFiltersType,
    pagination: { page: number; limit: number },
    userId?: string
  ): Promise<PaginatedResponse<DexMonster>> {
    try {
      const { page, limit } = pagination

      // Build filter stage
      const matchConditions: MongoMatchConditions = {}

      // Status filter
      matchConditions.status = filters.status || 'published'

      // Category filter
      if (filters.category) {
        matchConditions.category = filters.category
      }

      // Author filter
      if (filters.author) {
        matchConditions['author.name'] = { $in: [filters.author] }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        matchConditions.tags = { $in: filters.tags }
      }

      // World filter
      if (filters.world) {
        matchConditions['spawning.worlds'] = { $in: [filters.world] }
      }

      // Biome filter
      if (filters.biome) {
        matchConditions['spawning.biomes'] = { $in: [filters.biome] }
      }

      // Structure filter
      if (filters.structure) {
        matchConditions['spawning.structures'] = { $in: [filters.structure] }
      }

      // Spawn rate filter
      if (filters.spawnRate) {
        matchConditions['spawning.spawnRate'] = filters.spawnRate
      }

      // Search filter
      if (filters.search) {
        const searchRegex = { $regex: filters.search, $options: 'i' }
        matchConditions.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { excerpt: searchRegex },
          { behaviors: searchRegex },
          { tags: searchRegex }
        ]
      }

      // Get total count for pagination  
      const total = await this.count(matchConditions as Filter<DexMonster>)
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit)
      const skip = (page - 1) * limit
      const paginationInfo = {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      // Build sort stage
      let sortStage: MongoSortStage = {}
      switch (filters.sortBy || 'latest') {
        case 'popular':
          sortStage = { 'stats.likesCount': -1, 'stats.viewsCount': -1 }
          break
        case 'views':
          sortStage = { 'stats.viewsCount': -1 }
          break
        case 'name':
          sortStage = { name: 1 }
          break
        default: // 'latest'
          sortStage = { createdAt: -1 }
      }

      // Build aggregation pipeline
      const pipeline: MongoAggregationStage[] = []
      pipeline.push({ $match: matchConditions })
      pipeline.push({ $sort: sortStage })
      if (skip > 0) {
        pipeline.push({ $skip: skip })
      }
      pipeline.push({ $limit: limit })

      const rawMonsters = await this.aggregate(pipeline)

      // Parse and validate MongoDB documents with Zod schema
      const monsters = rawMonsters.map(doc => MongoDexMonsterSchema.parse(doc))

      return {
        data: monsters,
        pagination: paginationInfo
      }
    } catch (error) {
      handleDatabaseError(error, 'fetch dex monsters')
    }
  }

  /**
   * Get single monster with stats
   */
  async getMonsterWithStats(monsterId: string | ObjectId, userId?: string, includeAllStatuses = false): Promise<DexMonster | null> {
    try {
      const filter: any = { _id: new ObjectId(monsterId) }
      if (!includeAllStatuses) {
        filter.status = 'published'
      }
      
      const rawMonster = await this.findOne(filter)
      
      if (!rawMonster) {
        return null
      }
      
      // Parse and validate MongoDB document with Zod schema
      return MongoDexMonsterSchema.parse(rawMonster)
    } catch (error) {
      handleDatabaseError(error, 'fetch dex monster by ID')
    }
  }

  /**
   * Get single monster by slug with user interactions
   */
  async getMonsterBySlug(slug: string, userId?: string, includeAllStatuses = false): Promise<DexMonster | null> {
    try {
      const filter: any = { slug }
      if (!includeAllStatuses) {
        filter.status = 'published'
      }
      
      const rawMonster = await this.findOne(filter)

      if (!rawMonster) {
        return null
      }

      // Parse and validate MongoDB documents with Zod schema
      const monster = MongoDexMonsterSchema.parse(rawMonster)

      // Note: View count increment is handled in the API route to avoid double counting
      return monster
    } catch (error) {
      handleDatabaseError(error, 'fetch dex monster by slug')
    }
  }

  /**
   * Create new dex monster with slug uniqueness check (consistent with wiki/blog/forum pattern)
   */
  async createMonster(monsterData: CreateMonsterData): Promise<string> {
    try {
      // Generate unique slug from title
      const baseSlug = generateSlug(monsterData.name)
      let uniqueSlug = baseSlug
      let counter = 1
      
      // Ensure slug uniqueness by checking existing monsters
      while (await this.findOne({ slug: uniqueSlug })) {
        uniqueSlug = generateSlugWithCounter(baseSlug, counter)
        counter++
      }
      
      // Extract plain text from description for excerpt
      const plainText = monsterData.description ? monsterData.description.replace(/<[^>]*>/g, '').trim() : ''
    
      const monsterId = new ObjectId()
      const monster = {
        _id: monsterId,
        ...monsterData,
        id: monsterId.toString(),
        slug: uniqueSlug, // Use the unique slug
        // Ensure required fields have defaults
        excerpt: monsterData.excerpt || plainText.substring(0, 200),
        tags: monsterData.tags || [],
        behaviors: monsterData.behaviors || [],
        drops: monsterData.drops || [],
        // Initialize embedded stats (consistent with wiki/blog/forum)
        stats: {
          ...monsterData.stats,
          viewsCount: 0,
          likesCount: 0,
          bookmarksCount: 0,
          sharesCount: 0
        },
        // Ensure required fields
        status: monsterData.status || 'published',
        // Standardized timestamp fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      }

      const result = await this.insertOne(monster)
      
      // Update category monster count
      if (monsterData.category) {
        await this.categoriesDAL.updateOne(
          { slug: monsterData.category },
          { 
            $inc: { 'stats.postsCount': 1 },
            $set: { updatedAt: new Date().toISOString() }
          }
        )
      }

      return monsterId.toString()
    } catch (error) {
      handleDatabaseError(error, 'create dex monster')
    }
  }

  /**
   * Update dex monster by slug (consistent with wiki pattern)
   */
  async updateMonster(
    slug: string, 
    updateData: Partial<Pick<DexMonster, 'name' | 'description' | 'excerpt' | 'category' | 'behaviors' | 'drops' | 'spawning' | 'tags' | 'status'>>,
    userId: string
  ): Promise<boolean> {
    const updateDoc: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    const result = await this.updateOne(
      { slug },
      { $set: updateDoc }
    )
    
    return result.modifiedCount > 0
  }

  /**
   * Delete dex monster by slug (soft delete with cascading cleanup)
   */
  async deleteMonster(slug: string): Promise<boolean> {
    try {
      // First get the monster to find its ID
      const monster = await this.findOne({ slug })
      if (!monster) {
        return false
      }

      // Perform soft delete of the monster
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
        // TODO: Implement monster reference cleanup when needed
        // try {
        //   await ReferentialIntegrityManager.cleanupMonsterReferences(monster.id, this)
        // } catch (cleanupError) {
        //   console.error('Error during cleanup, but monster deletion succeeded:', cleanupError)
        // }
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error in deleteMonster:', error)
      return false
    }
  }

  /**
   * Record user interaction (like, bookmark, etc.) using statsManager
   */
  async recordInteraction(
    userId: string,
    targetId: string,
    interactionType: 'like' | 'bookmark' | 'share' | 'view'
  ) {
    // Handle views separately as they don't toggle
    if (interactionType === 'view') {
      const isNew = await statsManager.recordDexView(userId, targetId)
      return { isNew, action: 'added', currentState: true }
    }
    
    // Handle other interactions using statsManager
    const result = await statsManager.handleInteraction(
      userId, 
      targetId, 
      interactionType as 'like' | 'bookmark' | 'share'
    )
    
    // Transform statsManager response to match expected interface
    const isLiked = result.interactions?.isLiked || false
    const isBookmarked = result.interactions?.isBookmarked || false
    const isShared = result.interactions?.isShared || false
    
    let currentState = false
    switch (interactionType) {
      case 'like': currentState = isLiked; break
      case 'bookmark': currentState = isBookmarked; break
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
   * Get dex categories
   */
  async getCategories(): Promise<DexCategory[]> {
    return await this.categoriesDAL.find(
      { isActive: true },
      { sort: { order: 1 } }
    )
  }

  /**
   * Get dex statistics
   */
  async getStats(): Promise<DexStats> {
    const [
      totalViews,
      categories,
      popularMonsters,
      recentMonsters
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
            projection: { name: 1, slug: 1, 'stats.viewsCount': 1, 'stats.likesCount': 1 }
          }
        ).toArray()
      })(),
      (async () => {
        const col = await this.getCollection()
        return col.find(
          { status: 'published' },
          { 
            sort: { createdAt: -1 },
            limit: 5,
            projection: { name: 1, slug: 1, 'stats.viewsCount': 1, createdAt: 1 }
          }
        ).toArray()
      })()
    ])

    const collection = await this.getCollection()
    const monstersCount = await collection.countDocuments({ status: 'published' })
    const authors = await collection.distinct('author', { status: 'published' })
    const authorsCount = authors.length
    
    // Build monsters count by category
    const monstersCountByCategory: Record<string, number> = {}
    for (const category of categories) {
      monstersCountByCategory[category.slug] = category.stats?.postsCount || 0
    }

    // Aggregate total likes and shares from all monsters
    const statsAggregation = await this.aggregate<{
      _id: null,
      totalLikes: number,
      totalShares: number
    }>([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $ifNull: ['$stats.likesCount', 0] } },
          totalShares: { $sum: { $ifNull: ['$stats.sharesCount', 0] } }
        }
      }
    ])
    
    const aggregatedStats = statsAggregation[0] || { totalLikes: 0, totalShares: 0 }

    return {
      // Base StatsResponse properties
      totalPosts: monstersCount,
      totalViews,
      totalLikes: aggregatedStats.totalLikes,
      totalShares: aggregatedStats.totalShares,
      totalUsers: authorsCount,
      activeUsers: authorsCount, // Active users would require user activity tracking
      categoriesCount: categories.length,
      
      // DexStats-specific properties
      totalMonsters: monstersCount,
      totalDrafts: await this.count({ status: 'draft' as const, isDeleted: { $ne: true } }),
      monstersCountByCategory,
      categories: categories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        postsCount: cat.stats?.postsCount || 0,
        order: cat.order
      })),
      popularPosts: popularMonsters.map((monster) => ({
        title: monster.name,
        slug: monster.slug,
        viewsCount: monster.stats?.viewsCount || 0,
        likesCount: monster.stats?.likesCount || 0
      })),
      recentPosts: recentMonsters.map((monster) => ({
        title: monster.name,
        slug: monster.slug,
        viewsCount: monster.stats?.viewsCount || 0,
        createdAt: monster.createdAt || new Date().toISOString()
      }))
    }
  }

  /**
   * Increment view count for anonymous users (direct stats update)
   */
  async incrementDexViewCount(id: string): Promise<void> {
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
   * Public method to get dex monsters collection (consistent with wiki/blog/forum)
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