// =============================================
// DATABASE MODELS - Clean, organized exports
// =============================================

// Base interfaces
export * from './base'

// User model
export * from './user'

// Analytics model (keep until analytics migration)
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

// Content types now exported from schemas (schema-first pattern)
export type {
  BlogPost,
  BlogCategory
} from '@/lib/schemas/blog'

export type {
  ForumPost,
  ForumReply,
  ForumCategory
} from '@/lib/schemas/forum'

export type {
  WikiGuide,
  WikiCategory
} from '@/lib/schemas/wiki'

export type {
  DexMonster,
  DexCategory
} from '@/lib/schemas/dex'

export type {
  ServerMetrics,
  ActivityLog,
  Notification,
  SearchIndex
} from './analytics'