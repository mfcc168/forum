/**
 * Utility Types and MongoDB Integration
 * 
 * Common utility types, enums, and MongoDB-specific definitions
 */

import type { Entity } from './base'
import type { ApiResponse } from './api'

// ============================================================================
// UTILITY TYPES AND ENUMS
// ============================================================================

/** Content status options */
export type ContentStatus = 'draft' | 'published' | 'archived'

/** Content module types for permission system */
export type ContentModule = 'wiki' | 'blog' | 'forum' | 'dex'

/** User role hierarchy */
export type UserRole = 'admin' | 'moderator' | 'vip' | 'member' | 'banned'

/** User account status */
export type UserStatus = 'active' | 'suspended' | 'banned'

/** Content interaction types */
export type InteractionType = 'like' | 'dislike' | 'bookmark' | 'share' | 'report' | 'view' | 'helpful'

/** Wiki difficulty levels */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

/** Content sorting options */
export type SortOption = 'latest' | 'popular' | 'trending' | 'oldest' | 'replies' | 'helpful'

/** Supported language codes */
export type LanguageCode = 'en' | 'zh-TW'

// ============================================================================
// UTILITY TYPES FOR COMMON PATTERNS
// ============================================================================

/** Make specific fields required while keeping others optional */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make specific fields optional while keeping others required */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Add timestamp fields to any type */
export type WithTimestamps<T> = T & {
  createdAt: string
  updatedAt: string
}

/** Entity with all base fields */
export type WithEntityFields<T> = T & Entity

/** Create a partial type but keep ID required */
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>

/** Extract the data type from API response */
export type ExtractResponseData<T> = T extends ApiResponse<infer U> ? U : never

/** Create a type-safe filter for content */
export type FilterOptions<T> = Partial<{
  [K in keyof T]: T[K] extends string ? string | string[] : T[K]
}> & {
  search?: string
  sortBy?: string
  page?: number
  limit?: number
}

/** Generic content item interface for permission checking */
export interface ContentItem {
  id: string                    // Required for permission checks
  slug?: string                 // Optional - not all content types have slugs (e.g., replies)
  author: {                     // Required for ownership checks
    id: string
    name?: string
    avatar?: string
  }
}

/** Partial content item for permission checking with optional fields */
export interface PartialContentItem {
  id?: string
  slug?: string
  author?: {
    id: string
    name?: string
    avatar?: string
  }
}

/** Simplified user interface for permission checking */
export interface PermissionUser {
  id: string
  role: UserRole
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/** Application error base interface */
export interface AppError {
  code: string
  message: string
  statusCode: number
  details?: unknown
}

/** Validation error details */
export interface ValidationErrorDetail {
  field: string
  message: string
}

/** Database error interface */
export interface DatabaseErrorInterface extends AppError {
  operation?: string
  collection?: string
}

/** Validation error interface */
export interface ValidationErrorInterface extends AppError {
  details: ValidationErrorDetail[]
}

/** API error response */
export interface ApiError {
  error: string
  code: string
  details?: unknown
  statusCode: number
}

// ============================================================================
// MONGODB INTEGRATION  
// ============================================================================

/** MongoDB ObjectId type */
export type ObjectId = string

/** Database index definition */
export interface IndexDefinition {
  collection: string
  index: Record<string, 1 | -1 | 'text'>
  options?: {
    unique?: boolean
    sparse?: boolean
    background?: boolean
    name?: string
    weights?: Record<string, number>
    partialFilterExpression?: Record<string, unknown>
    expireAfterSeconds?: number
  }
}

/** Index statistics */
export interface IndexStats {
  indexes: Array<{
    name: string
    keys: Record<string, 'text' | 1 | -1>
    unique: boolean
    sparse: boolean
    background: boolean
  }>
  usage: number
}