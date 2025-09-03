// =============================================
// DATABASE MODELS - Clean, organized exports
// =============================================

// Base interfaces
export * from './base'

// User model
export * from './user'

// Blog model
export * from './blog'

// Analytics model
export * from './analytics'

export type {
  BaseDocument,
  SoftDeleteDocument
} from './base'

export type {
  User,
  UserProfile,
  UserStats, 
  UserPreferences,
  UserRef,
  UserInteraction
} from './user'

// Forum types from unified types module
export type {
  ForumPost,
  ForumCategory,
  ForumReply
} from '@/lib/types'

export type {
  BlogPost,
  BlogComment,
  BlogPostContent
} from './blog'

export type {
  ServerMetrics,
  ActivityLog,
  Notification,
  SearchIndex
} from './analytics'