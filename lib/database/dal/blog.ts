/**
 * Blog Database Access Layer
 * 
 * Uses embedded stats with atomic operations for optimal performance and reliability.
 * Follows the same pattern as Forum DAL for consistency.
 */

import { ObjectId, Filter } from 'mongodb'
import { BaseDAL } from './base'
import { statsManager } from '@/lib/database/stats'
import { MongoBlogPostSchema, type BlogPost } from '@/lib/database/schemas'
import { handleDatabaseError } from '@/lib/utils/error-handler'
import { ReferentialIntegrityManager } from '@/lib/database/referential-integrity'
import { 
  createBlogPostsAggregationPipeline, 
  createSingleBlogPostPipeline 
} from '@/lib/database/aggregation-utils'
import { 
  BlogPostQueryBuilder,
  type BlogPostFilters,
  calculatePagination,
  createSlugMatch 
} from '@/lib/database/query-builder'
import type { 
  BlogCategory, 
  UserInteraction, 
  PaginatedResponse
} from '@/lib/types'

// Concrete DAL implementations
class BlogInteractionDAL extends BaseDAL<UserInteraction> {
  constructor() { super('userInteractions') }
  
  // Public method to access collection for upsert operations
  async getCollectionPublic() {
    return this.getCollection()
  }
}

class BlogCategoryDAL extends BaseDAL<BlogCategory> {
  constructor() { super('blogCategories') }
}

export class BlogDAL extends BaseDAL<BlogPost> {
  private interactionsDAL: BlogInteractionDAL
  private categoriesDAL: BlogCategoryDAL

  constructor() {
    super('blogPosts')
    this.interactionsDAL = new BlogInteractionDAL()
    this.categoriesDAL = new BlogCategoryDAL()
  }

  /**
   * Get blog post by slug with stats
   */
  async getPostBySlug(slug: string, userId?: string, includeAllStatuses = false): Promise<BlogPost | null> {
    try {
      const additionalFilters = includeAllStatuses ? {} : { status: 'published' }
      const matchStage = createSlugMatch(slug, additionalFilters)
      const collection = await this.getCollection()
      const pipeline = createSingleBlogPostPipeline(matchStage, userId)
      
      const results = await collection.aggregate(pipeline).toArray()
      const doc = results[0]
      
      
      // Parse and validate MongoDB document with Zod schema
      return doc ? MongoBlogPostSchema.parse(doc) : null
    } catch (error) {
      handleDatabaseError(error, 'fetch blog post by slug')
    }
  }

  /**
   * Get paginated blog posts with filters
   */
  async getPosts(
    filters: BlogPostFilters,
    pagination: { page: number; limit: number },
    userId?: string
  ): Promise<PaginatedResponse<BlogPost>> {
    try {
      const { page, limit } = pagination

      // Build filter and sort using query builder
      const queryBuilder = BlogPostQueryBuilder.fromFilters(filters)
      const filter = queryBuilder.buildFilter()
      const sort = queryBuilder.buildSort()

      // Get total count for pagination
      const total = await this.count(filter as Filter<BlogPost>)
      
      // Calculate pagination info
      const paginationInfo = calculatePagination(page, limit, total)

      // Use simplified aggregation pipeline
      const collection = await this.getCollection()
      const pipeline = createBlogPostsAggregationPipeline(filter, sort, paginationInfo.skip, limit, userId)
      const rawPosts = await collection.aggregate(pipeline).toArray()

      // Parse and validate MongoDB document with Zod schema
      const posts = rawPosts.map(doc => MongoBlogPostSchema.parse(doc))

      return {
        data: posts,
        pagination: paginationInfo
      }
    } catch (error) {
      handleDatabaseError(error, 'fetch blog posts')
    }
  }

  /**
   * Create blog post with slug uniqueness check
   */
  async createPost(postData: Omit<BlogPost, '_id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
    try {
      // Ensure slug uniqueness by checking existing posts
      let uniqueSlug = postData.slug
      let counter = 1
      
      while (await this.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${postData.slug}-${counter}`
        counter++
      }

      const post: Omit<BlogPost, '_id'> = {
        ...postData,
        slug: uniqueSlug, // Use the unique slug
        // Initialize embedded stats (consistent with forum)
        stats: {
          likesCount: 0,
          viewsCount: 0,
          bookmarksCount: 0,
          sharesCount: 0
        },
        // Standardized timestamp fields
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: postData.status === 'published' ? new Date().toISOString() : undefined
      }

      const result = await this.insertOne(post)
      return result.insertedId.toString()
    } catch (error) {
      handleDatabaseError(error, 'create blog post')
    }
  }

  /**
   * Update blog post
   */
  async updatePost(slug: string, updateData: Partial<Pick<BlogPost, 'title' | 'content' | 'excerpt' | 'category' | 'tags' | 'status'>>): Promise<boolean> {
    const updateDoc: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date()
    }

    // Set publishedAt if status is being set to published
    if (updateData.status === 'published') {
      updateDoc.publishedAt = new Date()
    }

    const result = await this.updateOne(
      { slug },
      { $set: updateDoc }
    )
    
    return result.modifiedCount > 0
  }

  /**
   * Delete blog post (soft delete with cascading cleanup)
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
            isDeleted: true, 
            deletedAt: new Date(),
            updatedAt: new Date().toISOString()
          } 
        }
      )

      if (result.modifiedCount > 0) {
        try {
          // Clean up all foreign key references
          await ReferentialIntegrityManager.cleanupBlogPostReferences(post.id, this)
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
   * Increment view count (using embedded stats + legacy field for compatibility)
   */
  async incrementBlogViewCount(id: string): Promise<void> {
    await this.updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { 'stats.viewsCount': 1 },
        $set: { updatedAt: new Date().toISOString() }
      }
    )
  }

  /**
   * Record user interaction using unified statsManager (consistent with forum)
   */
  async recordInteraction(
    userId: string,
    targetId: string,
    targetType: 'post',
    interactionType: 'like' | 'bookmark' | 'share' | 'view'
  ): Promise<{ isNew: boolean; stats?: object; userInteraction?: object }> {
    try {
      if (interactionType === 'view') {
        // Handle view interactions using unified stats pattern
        const isNew = await statsManager.recordBlogView(userId, targetId)
        return { isNew }
      } else {
        // Handle like/bookmark/share using unified stats pattern
        const result = await statsManager.handleBlogInteraction(userId, targetId, interactionType)
        return {
          isNew: !result.interactions?.isLiked && interactionType === 'like' ||
                 !result.interactions?.isBookmarked && interactionType === 'bookmark' ||
                 interactionType === 'share',
          stats: result.stats,
          userInteraction: result.interactions
        }
      }
    } catch (error) {
      console.error('Blog interaction error:', error)
      throw new Error(`Failed to record ${interactionType} interaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get blog categories with post counts
   */
  async getCategories(): Promise<BlogCategory[]> {
    await this.init()
    
    // Get actual post counts for each category
    const postCounts = await this.db
      .collection('blogPosts')
      .aggregate([
        { $match: { status: 'published', isDeleted: { $ne: true }, category: { $ne: null } } },
        {
          $group: {
            _id: '$category',
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
    const baseCategories = await this.categoriesDAL.find({ isDeleted: { $ne: true } })
    
    // If no categories in database, use static config
    if (baseCategories.length === 0) {
      const { BLOG_CATEGORIES } = await import('@/lib/config/blog-categories')
      return BLOG_CATEGORIES
        .sort((a, b) => a.order - b.order)
        .map((cat) => ({
          id: cat.id,
          name: cat.id,
          slug: cat.id,
          description: cat.description,
          isActive: true,
          order: cat.order,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            postsCount: countMap[cat.id] || 0,
            viewsCount: 0
          }
        }))
    }

    // Enrich existing categories with post counts
    return baseCategories.map(cat => ({
      ...cat,
      stats: {
        ...cat.stats,
        postsCount: countMap[cat.name || cat.id] || 0
      }
    }))
  }


  /**
   * Get blog stats
   */
  async getStats(): Promise<{
    totalPosts: number
    totalViews: number
    categoriesCount: number
    totalUsers: number
    categories: BlogCategory[]
  }> {
    const collection = await this.getCollection()
    const [
      totalPosts,
      totalViews,
      categories,
      totalAuthors
    ] = await Promise.all([
      this.count({ status: 'published' as const, isDeleted: { $ne: true } }),
      collection.aggregate<{ total: number }>([
        { $match: { status: 'published', isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ]).toArray().then((result) => result[0]?.total || 0),
      this.getCategories(),
      collection.distinct('author', { status: 'published', isDeleted: { $ne: true } }).then((authors: unknown[]) => authors.length)
    ])

    return {
      totalPosts,
      totalViews,
      categoriesCount: categories.length,
      totalUsers: totalAuthors,
      categories
    }
  }

  /**
   * Public method to access named collections (for referential integrity)
   */
  async getNamedCollectionPublic(collectionName: string) {
    await this.init()
    return this.db!.collection(collectionName)
  }
}