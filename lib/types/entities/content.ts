/**
 * Content Entity Definitions
 * 
 * Main content types: ForumPost, BlogPost, WikiGuide
 * These follow a unified pattern with shared base properties.
 */

import type { Entity, UserRef, ContentStats, ContentInteractionState } from './base'

// ============================================================================
// CONTENT ENTITIES (unified pattern)
// ============================================================================

/** Base content interface */
interface BaseContent extends Entity {
  title: string
  content: string
  excerpt: string
  slug: string
  author: UserRef               // Embedded, no lookups
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  stats: ContentStats
  interactions?: ContentInteractionState
}

/** Forum post */
export interface ForumPost extends BaseContent {
  category: string              // Simple string
  categoryName: string          // Display name
  metaDescription?: string
  isPinned: boolean
  isLocked: boolean  
  lastReplyAt?: string
  stats: ContentStats & { repliesCount: number }  // Replies required for forum
}

/** Blog post */
export interface BlogPost extends BaseContent {
  category: string
  featuredImage?: string
  publishedAt?: string
  metaDescription?: string
  // No replies for blog posts
}

/** Wiki guide */
export interface WikiGuide extends BaseContent {
  category: 'getting-started' | 'gameplay' | 'features' | 'community'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  featuredImage?: string
  version: number
  lastReviewDate?: string
  reviewedBy?: string
  stats: ContentStats & { helpfulsCount: number }  // Helpful required for wiki
}

/** Forum reply */
export interface ForumReply extends Entity {
  postId: string
  content: string
  author: UserRef
  replyToId?: string
  stats: {
    likesCount: number
    dislikesCount: number
    reportsCount: number
  }
  interactions?: ContentInteractionState
}
