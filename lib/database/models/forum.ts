import { ObjectId } from 'mongodb'
import { SoftDeleteDocument } from './base'
import { UserRef } from './user'

// =============================================
// FORUM MODEL - Posts, Replies, and Categories
// =============================================

export interface ForumPost extends SoftDeleteDocument {
  // Content
  title: string
  content: string                  // HTML/Markdown content
  plainText: string                // Searchable plain text
  slug: string                     // URL-friendly identifier
  
  // References
  authorId: ObjectId
  author: UserRef                  // Embedded user data (avoid N+1 queries)
  categoryId: ObjectId
  categoryPath: string             // e.g., "general/announcements"
  
  // Organization
  tags: string[]
  
  // State
  status: 'draft' | 'published' | 'archived'
  isPinned: boolean               // ✅ Consistent boolean naming
  isLocked: boolean               // ✅ Consistent boolean naming
  isFeatured: boolean             // ✅ Consistent boolean naming
  
  // Statistics (embedded for performance)
  stats: {
    likesCount: number            // ✅ Consistent 'Count' suffix
    viewsCount: number            // ✅ Consistent 'Count' suffix
    sharesCount: number           // ✅ Consistent 'Count' suffix
    bookmarksCount: number        // ✅ Consistent 'Count' suffix
    repliesCount: number          // ✅ Consistent 'Count' suffix
    uniqueViewsCount: number      // ✅ Distinct viewer count
    lastActivityAt: Date          // ✅ Consistent timestamp naming
  }
  
  // Publishing
  publishedAt?: Date              // ✅ Consistent timestamp naming
  lastReplyAt?: Date              // ✅ Last reply timestamp
  
  // Indexes: categoryPath + status + isPinned + lastReplyAt + createdAt,
  //          authorId + status + createdAt, tags + status + createdAt,
  //          slug(unique), status + publishedAt
}

export interface ForumReply extends SoftDeleteDocument {
  // References
  postId: ObjectId
  authorId: ObjectId
  author: UserRef                 // Embedded user data
  parentReplyId?: ObjectId        // For nested replies
  
  // Content
  content: string                 // HTML/Markdown content
  plainText: string               // Searchable plain text
  
  // Hierarchy
  depth: number                   // Nesting depth (0 = direct reply to post)
  
  // Statistics
  stats: {
    likesCount: number            // ✅ Consistent 'Count' suffix
    dislikesCount: number         // ✅ Consistent 'Count' suffix
    reportsCount: number          // ✅ Consistent 'Count' suffix
  }
  
  // State
  status: 'pending' | 'approved' | 'hidden' | 'spam'
  moderatedBy?: ObjectId
  moderatedAt?: Date              // ✅ Consistent timestamp naming
  moderationReason?: string
  
  // Indexes: postId + createdAt, postId + parentReplyId + createdAt,
  //          authorId + createdAt, parentReplyId + createdAt
}

export interface ForumCategory extends SoftDeleteDocument {
  // Basic info
  name: string
  description: string
  slug: string
  path: string                    // Hierarchical path (e.g., "general/announcements")
  
  // Hierarchy
  parentId?: ObjectId             // Parent category
  depth: number                   // Nesting depth (0 = root category)
  order: number                   // Sort order within parent
  
  // Display
  icon?: string                   // Icon identifier or URL
  color?: string                  // Theme color
  
  // State
  isActive: boolean               // ✅ Consistent boolean naming
  isVisible: boolean              // ✅ Visible to users
  
  // Permissions
  moderatorIds: ObjectId[]        // Category moderators
  
  // Statistics
  stats: {
    postsCount: number            // ✅ Consistent 'Count' suffix
    repliesCount: number          // ✅ Consistent 'Count' suffix
    totalViewsCount: number       // ✅ Total views across all posts
    uniqueUsersCount: number      // ✅ Unique users who posted
  }
  
  // Activity tracking
  lastPostAt?: Date               // ✅ Last post timestamp
  lastPostId?: ObjectId           // Reference to last post
  
  // Indexes: parentId + order, isActive + order, path(unique), slug(unique)
}

// User interaction tracking
export interface ForumInteraction extends SoftDeleteDocument {
  userId: ObjectId
  targetType: 'post' | 'reply'
  targetId: ObjectId
  interactionType: 'like' | 'dislike' | 'bookmark' | 'share' | 'report' | 'view'
  
  // Metadata (optional based on interaction type)
  metadata?: {
    // For reports
    reason?: string
    description?: string
    
    // For shares
    platform?: 'twitter' | 'discord' | 'facebook' | 'reddit' | 'link'
    
    // For views
    durationSeconds?: number      // ✅ Time spent viewing
    referrer?: string
    exitPage?: string
    
    // For bookmarks
    collectionName?: string
    tags?: string[]
  }
  
  // Analytics
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  
  // Indexes: userId + targetType + targetId(unique), targetId + interactionType,
  //          userId + interactionType + createdAt, createdAt
}

// Forum statistics aggregation
export interface ForumStats {
  // Global counts
  totalPostsCount: number         // ✅ Consistent 'Count' suffix
  totalRepliesCount: number       // ✅ Consistent 'Count' suffix
  totalUsersCount: number         // ✅ Consistent 'Count' suffix
  totalCategoriesCount: number    // ✅ Consistent 'Count' suffix
  
  // Activity metrics
  activeUsersCount: number        // ✅ Users active in last 30 days
  postsToday: number
  postsThisWeek: number
  postsThisMonth: number
  
  // Engagement metrics
  averagePostsPerUser: number
  averageRepliesPerPost: number
  totalEngagementScore: number    // Composite engagement metric
  
  // Popular content
  mostActiveCategories: Array<{
    categoryId: ObjectId
    name: string
    postsCount: number
    repliesCount: number
  }>
  
  topPosters: Array<{
    userId: ObjectId
    username: string
    postsCount: number
    reputation: number
  }>
  
  // Time-based analytics
  lastUpdatedAt: Date             // ✅ When stats were last calculated
}