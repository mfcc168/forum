/**
 * Shared hook interfaces and types for consistent patterns across content types
 */

// Base interface for all content query options
export interface BaseContentQueryOptions {
  category?: string
  search?: string
  page?: number
  limit?: number
  enabled?: boolean
}

// Base sort options that all content types support
export type BaseSortOptions = 'latest' | 'popular' | 'views'

// Base status options for content
export type BaseStatusOptions = 'published' | 'draft' | 'archived'

// Extended interface for blog posts
export interface BlogPostQueryOptions extends BaseContentQueryOptions {
  sortBy?: BaseSortOptions
  status?: BaseStatusOptions
}

// Extended interface for forum posts (has unique sort and status options)
export interface ForumPostQueryOptions extends BaseContentQueryOptions {
  sortBy?: BaseSortOptions | 'replies' | 'oldest'
  status?: BaseStatusOptions | 'active' | 'locked' | 'all'
}

// Extended interface for wiki guides (has unique properties)
export interface WikiGuideQueryOptions extends BaseContentQueryOptions {
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  sortBy?: BaseSortOptions
  status?: BaseStatusOptions
  category?: 'getting-started' | 'gameplay' | 'features' | 'community'
}

// Base response structure for paginated content
export interface BaseContentResponse<T> {
  success: boolean
  message?: string
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
    filters: {
      category?: string
      search?: string
      status: string
      [key: string]: string | undefined
    }
  }
}

// Base single item response
export interface BaseSingleItemResponse<T> {
  success: boolean
  message?: string
  data: {
    item: T
  }
}