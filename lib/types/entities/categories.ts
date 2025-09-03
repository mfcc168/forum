/**
 * Category Entity Definitions
 * 
 * Category types for organizing content across different domains
 */

import type { Entity } from './base'

// ============================================================================
// CATEGORY ENTITIES (unified pattern)
// ============================================================================

/** Base category interface */
interface BaseCategory extends Entity {
  name: string
  description: string
  slug: string
  isActive: boolean
  order: number
  stats: { postsCount: number; viewsCount: number }
}

/** Forum category */
export interface ForumCategory extends BaseCategory {
  icon?: string
  color?: string
  moderators?: string[]
  lastPostAt?: string
  lastPostId?: string
}

/** Blog category */
export interface BlogCategory extends BaseCategory {
  color?: string
  lastPostAt?: string
  lastPostId?: string
}

/** Wiki category */
export interface WikiCategory extends BaseCategory {
  icon: string
  color: string
  parentId?: string
  lastGuideAt?: string
  lastGuideId?: string
}