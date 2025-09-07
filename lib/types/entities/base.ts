/**
 * Base Entity Patterns
 * 
 * Core interfaces that are used across all content types and entities.
 * These provide the foundation for consistent data modeling.
 */

// ============================================================================
// BASE PATTERNS (used by all entities)
// ============================================================================

/** Standard entity with consistent naming */
export interface Entity {
  id: string                    // Always string (converted from ObjectId)
  createdAt: string            // Always ISO string  
  updatedAt: string            // Always ISO string
}

/** Embedded user reference (no lookups needed) */
export interface UserRef {
  id: string
  name: string  
  avatar?: string
}

/** Consistent stats pattern for all content */
export interface ContentStats {
  viewsCount: number            // Consistent with existing codebase
  likesCount: number            // Consistent with existing codebase  
  bookmarksCount: number        // Consistent bookmark naming
  sharesCount: number           // Consistent with existing codebase
  repliesCount?: number         // Optional for blog/wiki
  helpfulsCount?: number        // Optional for wiki only - consistent plural naming
  // Additional stat properties for extensibility
  [key: `${string}Count`]: number | undefined
}

/** User interaction state for content (client-side display) */
export interface ContentInteractionState {
  isLiked: boolean
  isBookmarked: boolean
  isShared: boolean
  isHelpful?: boolean           // For wiki only
}

