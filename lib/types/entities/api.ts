/**
 * API Response Patterns
 * 
 * Consistent API response interfaces with generic patterns for reusability
 */

import type { ForumPost, BlogPost, WikiGuide } from './content'

// ============================================================================
// API PATTERNS (optimized with generics)
// ============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

/** Reusable pagination metadata */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

/** Base content filters - flexible for different content types */
export interface ContentFilters {
  category?: string
  search?: string  
  status?: string
  author?: string
  tags?: string[]
  sortBy?: string
  page?: number
  limit?: number
}

/** Forum post filters */
export interface PostFilters extends ContentFilters {
  categoryName?: string
  isPinned?: boolean
  isLocked?: boolean
}

/** Wiki guide filters */
export interface WikiFilters extends ContentFilters {
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime?: string
  status?: 'draft' | 'published' | 'archived'
}

/** User filters */
export interface UserFilters {
  role?: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
  status?: 'active' | 'suspended' | 'banned'
  search?: string
  page?: number
  limit?: number
}

// ============================================================================
// SPECIFIC API RESPONSES (maintaining backward compatibility)
// ============================================================================

/** Blog posts list response */
export type BlogPostsResponse = ApiResponse<{
  posts: BlogPost[]
  pagination: PaginationMeta
  filters: ContentFilters
}>

/** Forum posts list response */
export type ForumPostsResponse = ApiResponse<{
  posts: ForumPost[]
  pagination: PaginationMeta
  filters: ContentFilters
}>

/** Wiki guides list response */
export type WikiGuidesResponse = ApiResponse<{
  guides: WikiGuide[]
  pagination: PaginationMeta
  filters: ContentFilters & {
    difficulty?: string
    tags?: string[]
  }
}>

/** Single item responses */
export type BlogPostResponse = ApiResponse<BlogPost>
export type ForumPostResponse = ApiResponse<ForumPost>  
export type WikiGuideResponse = ApiResponse<WikiGuide>

/** Generic paginated response pattern */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
  filters?: ContentFilters
}

/** Type alias for consistency */
export type PaginatedResult<T> = PaginatedResponse<T>

/** Content response with user interactions */
export interface ContentResponse<T> {
  content: T
  interactions?: import('./base').ContentInteractionState
  relatedContent?: T[]
}

/** Base interaction response for simple stat updates */
export interface BaseInteractionResponse {
  success: boolean
  stats: import('./base').ContentStats
  interactions: import('./base').ContentInteractionState
}

/** Detailed interaction response with action metadata */
export interface DetailedInteractionResponse extends BaseInteractionResponse {
  action: 'added' | 'removed' | 'viewed'
  currentState: boolean
  isNew: boolean
}

