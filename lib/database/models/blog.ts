import { ObjectId } from 'mongodb'
import { SoftDeleteDocument } from './base'
import { UserRef } from './user'

// =============================================
// BLOG MODEL - Posts and Comments
// =============================================

export interface BlogPostContent {
  title: string
  slug: string
  excerpt: string
  content: string                  // ✅ Renamed from 'body' for consistency
  plainText: string
  wordCount: number
  readingTimeMinutes: number       // ✅ Clear unit specification
  
  // Rich content
  featuredImage?: {
    url: string
    alt: string
    caption?: string
  }
  images?: string[]
  
  // Content organization
  tableOfContents?: {
    level: number
    title: string
    anchor: string
  }[]
}

export interface BlogPost extends SoftDeleteDocument {
  content: BlogPostContent
  
  // Publishing
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publishedAt?: Date               // ✅ Consistent timestamp naming
  scheduledAt?: Date               // ✅ Consistent timestamp naming (renamed from scheduledFor)
  
  // Authoring
  author: UserRef
  coAuthors?: UserRef[]            // Multiple authors support
  editor?: UserRef                 // Last editor
  
  // Organization
  categories: string[]             // Multiple categories allowed
  tags: string[]
  
  // Engagement statistics (embedded for performance)
  stats: {
    viewsCount: number             // ✅ Consistent 'Count' suffix
    uniqueViewsCount: number       // ✅ Consistent 'Count' suffix
    likesCount: number             // ✅ Consistent 'Count' suffix
    sharesCount: number            // ✅ Consistent 'Count' suffix
    commentsCount: number          // ✅ Consistent 'Count' suffix
    averageRating: number          // ✅ Full word 'average'
    totalRatings: number
    
    // Social sharing breakdown
    socialShares: {
      facebookCount: number        // ✅ Consistent 'Count' suffix
      twitterCount: number         // ✅ Consistent 'Count' suffix
      linkedinCount: number        // ✅ Consistent 'Count' suffix
      otherCount: number           // ✅ Consistent 'Count' suffix
    }
    
    // Reader engagement metrics
    averageTimeOnPageSeconds: number  // ✅ Clear unit specification
    bounceRatePercentage: number      // ✅ Clear unit specification
  }
  
  // SEO metadata
  seo?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    focusKeyword?: string
    keywords?: string[]
    ogImage?: string
    schemaMarkup?: Record<string, unknown>
  }
  
  // Comment settings
  isCommentsEnabled: boolean       // ✅ Consistent boolean naming
  
  // Indexes: status + publishedAt, author._id, categories, tags, slug(unique)
}

export interface BlogComment extends SoftDeleteDocument {
  postId: ObjectId
  parentCommentId?: ObjectId       // For threaded comments
  depth: number                    // Nesting depth (0 = top-level)
  
  content: {
    content: string                // ✅ Renamed from 'body' for consistency
    plainText: string
  }
  
  author: UserRef
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  moderatedBy?: ObjectId
  moderatedAt?: Date              // ✅ Consistent timestamp naming
  moderationReason?: string
  
  // Interaction statistics
  stats: {
    likesCount: number            // ✅ Consistent 'Count' suffix
    dislikesCount: number         // ✅ Consistent 'Count' suffix
    reportsCount: number          // ✅ Consistent 'Count' suffix
  }
  
  // Anti-spam and analytics
  ipAddress?: string
  userAgent?: string
  spamScore?: number
  
  // Indexes: postId + createdAt, author._id, status, parentCommentId
}