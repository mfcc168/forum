import { ObjectId } from 'mongodb'
import { SoftDeleteDocument } from './base'
import { UserRef } from './user'

// =============================================
// WIKI MODEL - Guides and Categories
// =============================================

// Multilingual content structure
export interface MultilingualContent {
  en?: {
    title: string
    content: string               // HTML/Markdown content
    excerpt: string
    plainText: string             // Searchable plain text
    metaDescription?: string
  }
  'zh-TW'?: {
    title: string
    content: string
    excerpt: string
    plainText: string
    metaDescription?: string
  }
}

export interface WikiGuide extends SoftDeleteDocument {
  // Content (supports multilingual)
  content: MultilingualContent
  slug: string                    // URL-friendly identifier
  
  
  // References
  authorId: ObjectId
  author: UserRef                 // Embedded user data
  categoryId: ObjectId
  categoryPath: string            // e.g., "getting-started/installation"
  
  // Organization and metadata
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTimeMinutes: number    // ✅ Clear unit specification
  prerequisites?: string[]        // List of prerequisite guide slugs
  
  // State
  status: 'draft' | 'published' | 'archived' | 'under-review'
  isFeatured: boolean             // ✅ Consistent boolean naming
  isOfficial: boolean             // ✅ Official vs community guide
  
  // Statistics (embedded for performance)
  stats: {
    viewsCount: number            // ✅ Consistent 'Count' suffix
    likesCount: number            // ✅ Consistent 'Count' suffix
    bookmarksCount: number        // ✅ Consistent 'Count' suffix
    sharesCount: number           // ✅ Consistent 'Count' suffix
    helpfulsCount: number          // "Was this helpful?" votes
    notHelpfulCount: number       // "Was this helpful?" negative votes
    uniqueViewsCount: number      // ✅ Distinct viewer count
    averageRating: number         // 0-5 star rating
    totalRatings: number
  }
  
  // Content metadata
  version: number                 // Content version for tracking changes
  lastReviewedAt?: Date           // ✅ When content was last reviewed
  reviewedBy?: ObjectId           // Who last reviewed the content
  
  // Publishing
  publishedAt?: Date              // ✅ Consistent timestamp naming
  
  // Rich content
  featuredImage?: string          // Featured image URL
  icon?: string                   // Guide icon identifier
  
  // SEO metadata
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
    canonicalUrl?: string
    ogImage?: string
  }
  
  // Table of contents (auto-generated from content)
  tableOfContents?: Array<{
    level: number                 // Heading level (1-6)
    title: string
    anchor: string
    language: 'en' | 'zh-TW'
  }>
  
  // Indexes: categoryPath + status + difficulty + publishedAt,
  //          authorId + status + createdAt, tags + status + publishedAt,
  //          slug(unique), status + isFeatured + publishedAt
}

export interface WikiCategory extends SoftDeleteDocument {
  // Basic info
  name: string                    // Category name (used as key for translations)
  description: string
  slug: string
  path: string                    // Hierarchical path (e.g., "getting-started/installation")
  
  // Multilingual display names (optional - falls back to name)
  displayNames?: {
    en?: string
    'zh-TW'?: string
  }
  
  // Hierarchy
  parentId?: ObjectId             // Parent category
  depth: number                   // Nesting depth (0 = root category)
  order: number                   // Sort order within parent
  
  // Display
  icon?: string                   // Icon identifier
  color?: string                  // Theme color (hex code)
  
  // State
  isActive: boolean               // ✅ Consistent boolean naming
  isVisible: boolean              // ✅ Visible to users
  
  // Statistics
  stats: {
    guidesCount: number           // ✅ Consistent 'Count' suffix
    publishedGuidesCount: number  // ✅ Only published guides
    totalViewsCount: number       // ✅ Total views across all guides
    uniqueUsersCount: number      // ✅ Unique users who contributed
  }
  
  // Activity
  lastGuideAt?: Date              // ✅ Last guide published timestamp
  lastUpdatedAt: Date             // ✅ When category was last updated
  
  
  // Indexes: parentId + order, isActive + order, path(unique), slug(unique)
}

// User interaction with wiki content
export interface WikiInteraction extends SoftDeleteDocument {
  userId: ObjectId
  targetType: 'guide' | 'category'
  targetId: ObjectId
  interactionType: 'view' | 'like' | 'bookmark' | 'share' | 'helpful' | 'not-helpful' | 'rate'
  
  // Metadata based on interaction type
  metadata?: {
    // For ratings
    rating?: number               // 1-5 stars
    
    // For helpful votes
    comment?: string              // Optional feedback
    
    // For shares
    platform?: 'twitter' | 'discord' | 'facebook' | 'reddit' | 'link'
    
    // For views
    durationSeconds?: number      // ✅ Time spent reading
    scrollPercentage?: number     // How much of the guide was read
    referrer?: string
    language?: 'en' | 'zh-TW'     // Which language version was viewed
    
    // For bookmarks
    collectionName?: string
    tags?: string[]
  }
  
  // Analytics
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  
  // Indexes: userId + targetType + targetId + interactionType(unique),
  //          targetId + interactionType, userId + interactionType + createdAt
}

// Wiki-specific statistics
export interface WikiStats {
  // Global counts
  totalGuidesCount: number        // ✅ Consistent 'Count' suffix
  publishedGuidesCount: number    // ✅ Only published guides
  totalCategoriesCount: number    // ✅ Consistent 'Count' suffix
  totalContributorsCount: number  // ✅ Unique contributors
  
  // Content breakdown
  guidesByDifficulty: {
    beginner: number
    intermediate: number
    advanced: number
  }
  
  guidesCountByCategory: Record<string, number>  // Guides per category
  
  guidesByLanguage: {
    en: number
    'zh-TW': number
    both: number                  // Guides available in both languages
  }
  
  // Popular content
  mostViewedGuides: Array<{
    guideId: ObjectId
    slug: string
    title: string
    viewsCount: number
    difficulty: string
  }>
  
  topContributors: Array<{
    userId: ObjectId
    username: string
    guidesCount: number
    totalViews: number
  }>
  
  mostActiveCategories: Array<{
    categoryId: ObjectId
    name: string
    guidesCount: number
    totalViews: number
  }>
  
  // Recently updated content
  recentlyUpdated: Array<{
    guideId: ObjectId
    slug: string
    title: string
    updatedAt: Date
  }>
  
  // Quality metrics
  averageRating: number           // Overall average rating across all guides
  totalRatings: number
  helpfulnessRatio: number        // helpful / (helpful + not-helpful)
  
  // Time-based analytics
  lastUpdatedAt: Date             // ✅ When stats were last calculated
}