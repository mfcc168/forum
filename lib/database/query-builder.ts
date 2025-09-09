/**
 * Database Query Builder Utilities
 * 
 * Provides reusable query building functions to reduce repetition
 */

import { Filter, ObjectId } from 'mongodb'
import type { PostFilters, ForumPost, BlogPost, WikiGuide } from '@/lib/types'

/**
 * Blog post filters interface
 */
export interface BlogPostFilters {
  category?: string
  status?: 'published' | 'draft' | 'archived' | 'all'
  search?: string
  author?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Wiki guide filters interface
 */
export interface WikiGuideFilters {
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  status?: 'draft' | 'published' | 'archived' | 'all'
  author?: string
  tags?: string[]
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  skip?: number
}

/**
 * Standard sort options
 */
export interface SortOptions {
  field: string
  direction: 1 | -1
}

/**
 * Query builder for forum posts
 */
export class ForumPostQueryBuilder {
  private filter: Filter<ForumPost> = {}
  private sortOptions: Record<string, 1 | -1> = {}
  
  /**
   * Add status filter
   */
  withStatus(status?: string): this {
    if (status === 'active') {
      this.filter.status = 'published'
      this.filter.isDeleted = { $ne: true }
    } else if (status === 'locked') {
      this.filter.isLocked = true
    } else if (status === 'archived') {
      this.filter.status = 'archived'
    }
    // 'all' adds no filter
    return this
  }
  
  /**
   * Add category filter
   */
  withCategory(category?: string): this {
    if (category) {
      this.filter.categoryName = { $regex: category, $options: 'i' }
    }
    return this
  }
  
  /**
   * Add search filter
   */
  withSearch(searchTerm?: string): this {
    if (searchTerm) {
      // Use regex search instead of MongoDB text search to avoid index dependencies
      this.filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { excerpt: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    return this
  }
  
  /**
   * Add author filter
   */
  withAuthor(authorId?: string): this {
    if (authorId) {
      this.filter['author.id'] = authorId
    }
    return this
  }
  
  /**
   * Add tags filter
   */
  withTags(tags?: string[]): this {
    if (tags && tags.length > 0) {
      this.filter.tags = { $in: tags }
    }
    return this
  }
  
  /**
   * Add date range filter
   */
  withDateRange(startDate?: Date, endDate?: Date): this {
    if (startDate || endDate) {
      this.filter.createdAt = {}
      if (startDate) {
        this.filter.createdAt.$gte = startDate.toISOString()
      }
      if (endDate) {
        this.filter.createdAt.$lte = endDate.toISOString()
      }
    }
    return this
  }
  
  /**
   * Set sort options
   */
  sortBy(sortBy: string, searchTerm?: string): this {
    if (searchTerm) {
      // For regex search, sort by relevance factors instead of textScore
      this.sortOptions = { 
        isPinned: -1, 
        'stats.viewsCount': -1,
        createdAt: -1 
      }
    } else {
      switch (sortBy) {
        case 'popular':
          this.sortOptions = { 'stats.viewsCount': -1, createdAt: -1 }
          break
        case 'replies':
          this.sortOptions = { 'stats.repliesCount': -1, lastReplyAt: -1 }
          break
        case 'oldest':
          this.sortOptions = { createdAt: 1 }
          break
        default: // latest
          this.sortOptions = { isPinned: -1, lastReplyAt: -1, createdAt: -1 }
      }
    }
    return this
  }
  
  /**
   * Build final filter object
   */
  buildFilter(): Filter<ForumPost> {
    return this.filter
  }
  
  /**
   * Build final sort object
   */
  buildSort(): Record<string, unknown> {
    return this.sortOptions
  }
  
  /**
   * Static factory method for quick filter building
   */
  static fromFilters(filters: PostFilters): ForumPostQueryBuilder {
    const builder = new ForumPostQueryBuilder()
    
    return builder
      .withStatus(filters.status || 'active')
      .withCategory(filters.category)
      .withSearch(filters.search)
      .withAuthor(filters.author)
      .withTags(filters.tags)
      .sortBy(filters.sortBy || 'latest', filters.search)
  }
}

/**
 * Helper function to calculate pagination info
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
) {
  const pages = Math.ceil(total / limit)
  const skip = (page - 1) * limit
  
  return {
    page,
    limit,
    total,
    pages,
    skip,
    hasNext: page < pages,
    hasPrev: page > 1
  }
}

/**
 * Helper function to validate ObjectId
 */
export function validateObjectId(id: string | ObjectId): ObjectId | null {
  try {
    if (typeof id === 'string') {
      return ObjectId.isValid(id) ? new ObjectId(id) : null
    }
    return id
  } catch {
    return null
  }
}

/**
 * Helper function to create standard match stage for single document queries
 */
export function createSingleDocumentMatch(
  id: string | ObjectId,
  additionalFilters: Record<string, unknown> = {}
): { _id: ObjectId } & Record<string, unknown> | null {
  const objectId = validateObjectId(id)
  if (!objectId) return null
  
  return {
    _id: objectId,
    isDeleted: { $ne: true },
    ...additionalFilters
  }
}

/**
 * Helper function to create slug-based match stage
 */
export function createSlugMatch(
  slug: string,
  additionalFilters: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    slug,
    status: { $ne: 'archived' },
    isDeleted: { $ne: true },
    ...additionalFilters
  }
}

/**
 * Query builder for blog posts
 */
export class BlogPostQueryBuilder {
  private filter: Filter<BlogPost> = {}
  private sortOptions: Record<string, 1 | -1> = {}
  
  /**
   * Add status filter
   */
  withStatus(status: BlogPostFilters['status']): this {
    this.filter.isDeleted = { $ne: true }
    
    if (status === 'published') {
      this.filter.status = 'published'
    } else if (status === 'draft') {
      this.filter.status = 'draft'
    } else if (status === 'archived') {
      this.filter.status = 'archived'
    }
    // 'all' adds no additional status filter
    
    return this
  }
  
  /**
   * Add category filter
   */
  withCategory(category?: string): this {
    if (category) {
      this.filter.category = category
    }
    return this
  }
  
  /**
   * Add search filter (title, excerpt, content)
   */
  withSearch(searchTerm?: string): this {
    if (searchTerm) {
      this.filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { excerpt: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ]
    }
    return this
  }
  
  /**
   * Add author filter
   */
  withAuthor(authorId?: string): this {
    if (authorId) {
      this.filter['author.id'] = authorId
    }
    return this
  }
  
  /**
   * Add tags filter
   */
  withTags(tags?: string[]): this {
    if (tags && tags.length > 0) {
      this.filter.tags = { $in: tags }
    }
    return this
  }
  
  /**
   * Add date range filter
   */
  withDateRange(dateFrom?: Date, dateTo?: Date): this {
    if (dateFrom || dateTo) {
      this.filter.publishedAt = {}
      if (dateFrom) {
        this.filter.publishedAt.$gte = dateFrom.toISOString()
      }
      if (dateTo) {
        this.filter.publishedAt.$lte = dateTo.toISOString()
      }
    }
    return this
  }
  
  /**
   * Set sort options
   */
  sortBy(sortBy: 'latest' | 'popular' | 'views' | 'oldest' = 'latest'): this {
    switch (sortBy) {
      case 'popular':
        this.sortOptions = { 'stats.likesCount': -1, 'stats.viewsCount': -1, publishedAt: -1 }
        break
      case 'views':
        this.sortOptions = { 'stats.viewsCount': -1, publishedAt: -1 }
        break
      case 'oldest':
        this.sortOptions = { publishedAt: 1 }
        break
      default: // latest
        this.sortOptions = { publishedAt: -1, updatedAt: -1 }
    }
    return this
  }
  
  /**
   * Build final filter object
   */
  buildFilter(): Filter<BlogPost> {
    return this.filter
  }
  
  /**
   * Build final sort object
   */
  buildSort(): Record<string, 1 | -1> {
    return this.sortOptions
  }
  
  /**
   * Static factory method for quick filter building
   */
  static fromFilters(filters: BlogPostFilters): BlogPostQueryBuilder {
    const builder = new BlogPostQueryBuilder()
    
    return builder
      .withStatus(filters.status || 'published')
      .withCategory(filters.category)
      .withSearch(filters.search)
      .withAuthor(filters.author)
      .withTags(filters.tags)
      .withDateRange(filters.dateFrom, filters.dateTo)
      .sortBy('latest')
  }
}

/**
 * Query builder for wiki guides
 */
export class WikiGuideQueryBuilder {
  private filter: Filter<WikiGuide> = {}
  private sortOptions: Record<string, 1 | -1> = {}
  
  /**
   * Add status filter
   */
  withStatus(status: WikiGuideFilters['status']): this {
    this.filter.isDeleted = { $ne: true }
    
    if (status === 'published') {
      this.filter.status = 'published'
    } else if (status === 'draft') {
      this.filter.status = 'draft'
    } else if (status === 'archived') {
      this.filter.status = 'archived'
    } else {
      // Default to published only if no status specified
      this.filter.status = 'published'
    }
    
    return this
  }
  
  /**
   * Add category filter
   */
  withCategory(category?: string): this {
    if (category) {
      this.filter.category = category as 'getting-started' | 'gameplay' | 'features' | 'community' // Allow flexible category assignment for search
    }
    return this
  }
  
  /**
   * Add difficulty filter
   */
  withDifficulty(difficulty?: WikiGuideFilters['difficulty']): this {
    if (difficulty) {
      this.filter.difficulty = difficulty
    }
    return this
  }
  
  /**
   * Add search filter (title, excerpt, content, tags)
   */
  withSearch(searchTerm?: string): this {
    if (searchTerm) {
      this.filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { excerpt: { $regex: searchTerm, $options: 'i' } },
        { plainText: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    }
    return this
  }
  
  /**
   * Add author filter
   */
  withAuthor(authorId?: string): this {
    if (authorId) {
      this.filter['author.id'] = authorId
    }
    return this
  }
  
  /**
   * Add tags filter
   */
  withTags(tags?: string[]): this {
    if (tags && tags.length > 0) {
      this.filter.tags = { $in: tags }
    }
    return this
  }
  
  /**
   * Add date range filter
   */
  withDateRange(dateFrom?: Date, dateTo?: Date): this {
    if (dateFrom || dateTo) {
      this.filter.updatedAt = {}
      if (dateFrom) {
        this.filter.updatedAt.$gte = dateFrom.toISOString()
      }
      if (dateTo) {
        this.filter.updatedAt.$lte = dateTo.toISOString()
      }
    }
    return this
  }
  
  /**
   * Set sort options
   */
  sortBy(
    sortBy: 'latest' | 'popular' | 'views' | 'helpful' | 'oldest' = 'latest',
    hasSearch?: boolean
  ): this {
    if (hasSearch) {
      // For search results, prioritize relevance then popularity
      this.sortOptions = { 'stats.viewsCount': -1, updatedAt: -1 }
    } else {
      switch (sortBy) {
        case 'popular':
          this.sortOptions = { 'stats.viewsCount': -1, 'stats.likesCount': -1, updatedAt: -1 }
          break
        case 'views':
          this.sortOptions = { 'stats.viewsCount': -1, updatedAt: -1 }
          break
        case 'helpful':
          this.sortOptions = { 'stats.helpfulsCount': -1, 'stats.viewsCount': -1 }
          break
        case 'oldest':
          this.sortOptions = { createdAt: 1 }
          break
        default: // latest
          this.sortOptions = { updatedAt: -1, 'stats.viewsCount': -1 }
      }
    }
    return this
  }
  
  /**
   * Build final filter object
   */
  buildFilter(): Filter<WikiGuide> {
    return this.filter
  }
  
  /**
   * Build final sort object
   */
  buildSort(): Record<string, 1 | -1> {
    return this.sortOptions
  }
  
  /**
   * Static factory method for quick filter building
   */
  static fromFilters(filters: WikiGuideFilters): WikiGuideQueryBuilder {
    const builder = new WikiGuideQueryBuilder()
    
    return builder
      .withStatus(filters.status)
      .withCategory(filters.category)
      .withDifficulty(filters.difficulty)
      .withSearch(filters.search)
      .withAuthor(filters.author)
      .withTags(filters.tags)
      .withDateRange(filters.dateFrom, filters.dateTo)
      .sortBy('latest', !!filters.search)
  }
}