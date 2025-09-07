/**
 * API Response Patterns
 * 
 * Consistent API response interfaces with generic patterns for reusability
 */

import type { ForumPost, BlogPost, WikiGuide } from './content'
import type { ContentInteractionState, ContentStats } from './base'
import type { 
  ContentQueryOptions, 
  BlogPostQueryOptions, 
  ForumPostQueryOptions, 
  WikiGuideQueryOptions 
} from './queries'

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

/** Content filters - unified with query options */
export type ContentFilters = ContentQueryOptions & {
  status?: string
  author?: string
  tags?: string[]
  sortBy?: string
}

/** Forum post filters - extends query options with API-specific fields */
export type PostFilters = ForumPostQueryOptions & {
  categoryName?: string
  isPinned?: boolean
  isLocked?: boolean
  author?: string
  tags?: string[]
}

/** Blog post filters - extends query options with API-specific fields */
export type BlogFilters = BlogPostQueryOptions & {
  author?: string
  featuredImage?: boolean
}

/** Wiki guide filters - extends query options */  
export type WikiFilters = WikiGuideQueryOptions & {
  estimatedTime?: string
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
  blogPosts: BlogPost[]
  pagination: PaginationMeta
  filters: ContentFilters
}>

/** Forum posts list response */
export type ForumPostsResponse = ApiResponse<{
  forumPosts: ForumPost[]
  pagination: PaginationMeta
  filters: ContentFilters
}>

/** Wiki guides list response */
export type WikiGuidesResponse = ApiResponse<{
  wikiGuides: WikiGuide[]
  pagination: PaginationMeta
  filters: ContentFilters & {
    difficulty?: string
    tags?: string[]
  }
}>

/** Single item responses */
export type BlogPostResponse = ApiResponse<{ blogPost: BlogPost }>
export type ForumPostResponse = ApiResponse<{ forumPost: ForumPost }>  
export type WikiGuideResponse = ApiResponse<{ wikiGuide: WikiGuide }>

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
  interactions?: ContentInteractionState
  relatedContent?: T[]
}

/** Interaction response for simple stat updates */
export interface InteractionResponse {
  success: boolean
  stats: ContentStats
  interactions: ContentInteractionState
}

/** Detailed interaction response with action metadata */
export interface DetailedInteractionResponse extends InteractionResponse {
  action: 'added' | 'removed' | 'viewed'
  currentState: boolean
  isNew: boolean
}

