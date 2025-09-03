/**
 * Zod Database Schemas
 * 
 * Single source of truth for validation, types, and transforms.
 * Replaces manual transform functions with automatic Zod parsing.
 */

import { z } from 'zod'
import { ObjectId } from 'mongodb'

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

// User reference schema
export const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional()
})

// Content stats schema
export const ContentStatsSchema = z.object({
  viewsCount: z.number().default(0),
  likesCount: z.number().default(0),
  bookmarksCount: z.number().default(0),
  sharesCount: z.number().default(0),
  repliesCount: z.number().optional(),
  helpfulsCount: z.number().optional()
})

// User interactions schema
export const UserInteractionsSchema = z.object({
  isLiked: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  isShared: z.boolean().default(false),
  isHelpful: z.boolean().optional()
})

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
  role: z.enum(['admin', 'moderator', 'vip', 'member', 'banned']).default('member'),
  status: z.enum(['active', 'suspended', 'banned']).default('active'),
  profile: z.object({
    bio: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    minecraft: z.object({
      username: z.string().optional(),
      uuid: z.string().optional(),
      joinedServerAt: z.string().optional()
    }).default({})
  }).default({ minecraft: {} }),
  stats: z.object({
    posts: z.number().default(0),
    replies: z.number().default(0),
    likes: z.number().default(0),
    reputation: z.number().default(0),
    level: z.number().default(1)
  }).default({
    posts: 0,
    replies: 0,
    likes: 0,
    reputation: 0,
    level: 1
  }),
  preferences: z.object({
    language: z.enum(['en', 'zh-TW']).default('en'),
    theme: z.enum(['light', 'dark', 'auto']).default('light'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      mentions: z.boolean().default(true),
      replies: z.boolean().default(true)
    }).default({
      email: true,
      push: true,
      mentions: true,
      replies: true
    })
  }).default({
    language: 'en',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      mentions: true,
      replies: true
    }
  }),
  providers: z.record(z.unknown()).default({}),
  lastActiveAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const MongoUserSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  username: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  avatar: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  profile: z.unknown().optional(),
  stats: z.unknown().optional(),
  preferences: z.unknown().optional(),
  providers: z.unknown().optional(),
  lastActive: z.union([z.date(), z.string()]).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  isDeleted: z.boolean().optional()
})
.transform((doc): z.infer<typeof UserSchema> => {
  const toISOString = (date: Date | string | undefined): string => {
    if (date instanceof Date) return date.toISOString()
    if (typeof date === 'string') return date
    return new Date().toISOString()
  }

  return {
    id: doc._id?.toString() || doc.id || '',
    email: doc.email || '',
    name: doc.name || doc.username || 'Unknown User',
    avatar: doc.avatar,
    role: (doc.role === 'admin' || doc.role === 'moderator' || doc.role === 'vip' || doc.role === 'member' || doc.role === 'banned') 
      ? doc.role as 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
      : 'member',
    status: (doc.status === 'active' || doc.status === 'suspended' || doc.status === 'banned') 
      ? doc.status as 'active' | 'suspended' | 'banned'
      : 'active',
    profile: (doc.profile && typeof doc.profile === 'object') 
      ? doc.profile as z.infer<typeof UserSchema>['profile']
      : { minecraft: {} },
    stats: (doc.stats && typeof doc.stats === 'object') 
      ? doc.stats as z.infer<typeof UserSchema>['stats']
      : {
          posts: 0,
          replies: 0,
          likes: 0,
          reputation: 0,
          level: 1
        },
    preferences: (doc.preferences && typeof doc.preferences === 'object') 
      ? doc.preferences as z.infer<typeof UserSchema>['preferences']
      : {
          language: 'en',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            mentions: true,
            replies: true
          }
        },
    providers: (doc.providers && typeof doc.providers === 'object') 
      ? doc.providers as Record<string, unknown>
      : {},
    lastActiveAt: toISOString(doc.lastActive),
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt)
  }
})

// ============================================================================
// FORUM POST SCHEMAS
// ============================================================================

export const ForumPostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500),
  metaDescription: z.string().nullable().optional(),
  slug: z.string().min(1),
  author: UserRefSchema,
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  stats: ContentStatsSchema.extend({
    repliesCount: z.number().default(0)
  }),
  category: z.string(),
  categoryName: z.string(),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  lastReplyAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  interactions: UserInteractionsSchema.optional()
})

export const MongoForumPostSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.union([z.string(), z.object({}).passthrough()]).optional(),
  excerpt: z.string().optional(),
  metaDescription: z.string().nullable().optional(),
  slug: z.string().optional(),
  author: z.union([
    z.instanceof(ObjectId),
    z.object({
      _id: z.instanceof(ObjectId).optional(),
      id: z.string().optional(),
      username: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      avatar: z.string().optional()
    })
  ]).optional(),
  authorDetails: z.array(z.object({
    _id: z.instanceof(ObjectId).optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional()
  })).optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  stats: z.object({
    viewsCount: z.number().optional(),
    viewCount: z.number().optional(),
    likesCount: z.number().optional(),
    likeCount: z.number().optional(),
    bookmarksCount: z.number().optional(),
    saveCount: z.number().optional(),
    sharesCount: z.number().optional(),
    shareCount: z.number().optional(),
    repliesCount: z.number().optional(),
    replyCount: z.number().optional()
  }).optional(),
  category: z.union([z.string(), z.object({}).passthrough()]).optional(),
  categoryName: z.string().optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  lastReplyAt: z.union([z.date(), z.string()]).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  isLikedByUser: z.boolean().optional(),
  isBookmarkedByUser: z.boolean().optional(),
  interactions: z.unknown().optional(),
  isDeleted: z.boolean().optional()
})
.transform((doc): z.infer<typeof ForumPostSchema> => {
  // Transform author
  const transformAuthor = (author: unknown, authorDetails?: Array<Record<string, unknown>>): z.infer<typeof UserRefSchema> => {
    if (!author) {
      return { id: '', name: 'Unknown User' }
    }
    
    // Handle embedded author object (check first and most specifically)
    if (typeof author === 'object' && author !== null && 
        'id' in author && 'name' in author && !('_id' in author)) {
      const authorObj = author as { id: unknown; name: unknown; avatar?: unknown }
      return {
        id: String(authorObj.id),
        name: String(authorObj.name),
        avatar: authorObj.avatar as string | undefined
      }
    }
    
    // If we have authorDetails from lookup, use that
    if (authorDetails && authorDetails.length > 0) {
      const authorData = authorDetails[0]
      const _id = authorData._id as ObjectId | string | undefined
      const id = authorData.id as string | undefined
      const profile = authorData.profile as { displayName?: string; avatar?: string } | undefined
      const username = authorData.username as string | undefined
      const name = authorData.name as string | undefined
      const email = authorData.email as string | undefined
      const avatar = authorData.avatar as string | undefined
      
      return {
        id: (_id ? _id.toString() : id) || '',
        name: profile?.displayName || username || name || email || 'Unknown User',
        avatar: profile?.avatar || avatar
      }
    }
    
    // Handle string author ID (no lookup data available)
    if (typeof author === 'string') {
      return {
        id: author,
        name: 'Unknown User',
        avatar: undefined
      }
    }
    
    // Handle ObjectId or Buffer types
    if (author && typeof author === 'object' && ('_id' in author || 'toString' in author)) {
      const authorObj = author as { _id?: ObjectId | string; toString?: () => string }
      return {
        id: authorObj._id ? authorObj._id.toString() : (authorObj.toString ? authorObj.toString() : ''),
        name: 'Unknown User',
        avatar: undefined
      }
    }
    
    // Handle author object without _id (already processed)
    if (typeof author === 'object' && author !== null && !('_id' in author) && 'id' in author) {
      const authorObj = author as { id: unknown; name?: unknown; avatar?: unknown }
      return {
        id: typeof authorObj.id === 'string' ? authorObj.id : String(authorObj.id || ''),
        name: String(authorObj.name || 'Unknown User'),
        avatar: authorObj.avatar as string | undefined
      }
    }
    
    // Fallback - use author directly if it has user data
    if (author && typeof author === 'object') {
      const authorObj = author as Record<string, unknown>
      const _id = authorObj._id as ObjectId | string | undefined
      const id = authorObj.id as string | undefined
      const profile = authorObj.profile as { displayName?: string; avatar?: string } | undefined
      const username = authorObj.username as string | undefined
      const name = authorObj.name as string | undefined
      const email = authorObj.email as string | undefined
      const avatar = authorObj.avatar as string | undefined
      
      return {
        id: (_id ? _id.toString() : id) || '',
        name: profile?.displayName || username || name || email || 'Unknown User',
        avatar: profile?.avatar || avatar
      }
    }
    
    return { id: '', name: 'Unknown User' }
  }

  // Transform stats
  const transformStats = (stats: unknown) => {
    const statsObj = stats as Record<string, unknown> | null | undefined
    return {
      viewsCount: Number(statsObj?.viewsCount || statsObj?.viewCount || 0),
      likesCount: Number(statsObj?.likesCount || statsObj?.likeCount || 0),
      bookmarksCount: Number(statsObj?.bookmarksCount || 0),
      sharesCount: Number(statsObj?.sharesCount || statsObj?.shareCount || 0),
      repliesCount: Number(statsObj?.repliesCount || statsObj?.replyCount || 0)
    }
  }

  // Transform dates
  const toISOString = (date: Date | string | undefined): string => {
    if (date instanceof Date) return date.toISOString()
    if (typeof date === 'string') return date
    return new Date().toISOString()
  }

  return {
    id: doc._id?.toString() || doc.id || '',
    title: doc.title || 'Untitled',
    content: typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content || {}),
    excerpt: doc.excerpt || '',
    metaDescription: doc.metaDescription || undefined,
    slug: doc.slug || '',
    author: transformAuthor(doc.author, doc.authorDetails),
    tags: doc.tags || [],
    status: (doc.status === 'draft' || doc.status === 'published' || doc.status === 'archived') 
      ? doc.status as 'draft' | 'published' | 'archived'
      : 'published',
    stats: transformStats(doc.stats),
    category: typeof doc.category === 'string' ? doc.category : ((doc.category as Record<string, unknown>)?.name as string || 'general'),
    categoryName: doc.categoryName || (typeof doc.category === 'object' ? (doc.category as Record<string, unknown>)?.name as string || 'General' : 'General'),
    isPinned: doc.isPinned || false,
    isLocked: doc.isLocked || false,
    lastReplyAt: doc.lastReplyAt ? toISOString(doc.lastReplyAt) : undefined,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    interactions: (doc.interactions && typeof doc.interactions === 'object' && 'isLiked' in doc.interactions)
      ? doc.interactions as z.infer<typeof UserInteractionsSchema>
      : (doc.isLikedByUser !== undefined || doc.isBookmarkedByUser !== undefined ? {
          isLiked: Boolean(doc.isLikedByUser),
          isBookmarked: Boolean(doc.isBookmarkedByUser),
          isShared: false
        } : undefined)
  }
})

// ============================================================================
// BLOG POST SCHEMAS
// ============================================================================

export const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500),
  slug: z.string().min(1),
  author: UserRefSchema,
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  stats: ContentStatsSchema,
  category: z.string(),
  featuredImage: z.string().nullable().optional(),
  publishedAt: z.string().datetime().optional(),
  metaDescription: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  interactions: UserInteractionsSchema.optional()
})

export const MongoBlogPostSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.union([z.string(), z.object({}).passthrough()]).optional(),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  author: z.union([
    z.instanceof(ObjectId),
    z.object({
      _id: z.instanceof(ObjectId).optional(),
      id: z.string().optional(),
      username: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      avatar: z.string().optional()
    })
  ]).optional(),
  authorDetails: z.array(z.object({
    _id: z.instanceof(ObjectId).optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional()
  })).optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  stats: z.object({
    viewsCount: z.number().optional(),
    viewCount: z.number().optional(),
    likesCount: z.number().optional(),
    likeCount: z.number().optional(),
    bookmarksCount: z.number().optional(),
    saveCount: z.number().optional(),
    sharesCount: z.number().optional(),
    shareCount: z.number().optional()
  }).optional(),
  category: z.string(),
  featuredImage: z.string().nullable().optional(),
  publishedAt: z.union([z.date(), z.string()]).optional(),
  metaDescription: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  isLikedByUser: z.boolean().optional(),
  isBookmarkedByUser: z.boolean().optional(),
  interactions: z.unknown().optional(),
  isDeleted: z.boolean().optional()
})
.transform((doc): z.infer<typeof BlogPostSchema> => {
  const transformAuthor = (author: unknown, authorDetails?: Array<Record<string, unknown>>): z.infer<typeof UserRefSchema> => {
    if (!author) {
      return { id: '', name: 'Unknown User' }
    }
    
    // Handle embedded author object (check first and most specifically)
    if (typeof author === 'object' && author !== null && 
        'id' in author && 'name' in author && !('_id' in author)) {
      const authorObj = author as { id: unknown; name: unknown; avatar?: unknown }
      return {
        id: String(authorObj.id),
        name: String(authorObj.name),
        avatar: authorObj.avatar as string | undefined
      }
    }
    
    // If we have authorDetails from lookup, use that
    if (authorDetails && authorDetails.length > 0) {
      const authorData = authorDetails[0]
      const _id = authorData._id as ObjectId | string | undefined
      const id = authorData.id as string | undefined
      const profile = authorData.profile as { displayName?: string; avatar?: string } | undefined
      const username = authorData.username as string | undefined
      const name = authorData.name as string | undefined
      const email = authorData.email as string | undefined
      const avatar = authorData.avatar as string | undefined
      
      return {
        id: (_id ? _id.toString() : id) || '',
        name: profile?.displayName || username || name || email || 'Unknown User',
        avatar: profile?.avatar || avatar
      }
    }
    
    // Handle string author ID (no lookup data available)
    if (typeof author === 'string') {
      return {
        id: author,
        name: 'Unknown User',
        avatar: undefined
      }
    }
    
    // Handle ObjectId or Buffer types
    if (author && typeof author === 'object' && ('_id' in author || 'toString' in author)) {
      const authorObj = author as { _id?: ObjectId | string; toString?: () => string }
      return {
        id: authorObj._id ? authorObj._id.toString() : (authorObj.toString ? authorObj.toString() : ''),
        name: 'Unknown User',
        avatar: undefined
      }
    }
    
    // Handle author object without _id (already processed)
    if (typeof author === 'object' && author !== null && !('_id' in author) && 'id' in author) {
      const authorObj = author as { id: unknown; name?: unknown; avatar?: unknown }
      return {
        id: typeof authorObj.id === 'string' ? authorObj.id : String(authorObj.id || ''),
        name: String(authorObj.name || 'Unknown User'),
        avatar: authorObj.avatar as string | undefined
      }
    }
    
    // Fallback - use author directly if it has user data
    if (author && typeof author === 'object') {
      const authorObj = author as Record<string, unknown>
      const _id = authorObj._id as ObjectId | string | undefined
      const id = authorObj.id as string | undefined
      const profile = authorObj.profile as { displayName?: string; avatar?: string } | undefined
      const username = authorObj.username as string | undefined
      const name = authorObj.name as string | undefined
      const email = authorObj.email as string | undefined
      const avatar = authorObj.avatar as string | undefined
      
      return {
        id: (_id ? _id.toString() : id) || '',
        name: profile?.displayName || username || name || email || 'Unknown User',
        avatar: profile?.avatar || avatar
      }
    }
    
    return { id: '', name: 'Unknown User' }
  }

  const transformStats = (stats: unknown) => {
    const statsObj = stats as Record<string, unknown> | null | undefined
    return {
      viewsCount: Number(statsObj?.viewsCount || statsObj?.viewCount || 0),
      likesCount: Number(statsObj?.likesCount || statsObj?.likeCount || 0),
      bookmarksCount: Number(statsObj?.bookmarksCount || 0),
      sharesCount: Number(statsObj?.sharesCount || statsObj?.shareCount || 0)
    }
  }

  const toISOString = (date: Date | string | undefined): string => {
    if (date instanceof Date) return date.toISOString()
    if (typeof date === 'string') return date
    return new Date().toISOString()
  }

  return {
    id: doc._id?.toString() || doc.id || '',
    title: doc.title || 'Untitled',
    content: typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content || {}),
    excerpt: doc.excerpt || '',
    slug: doc.slug || '',
    author: transformAuthor(doc.author, doc.authorDetails),
    tags: doc.tags || [],
    status: (doc.status === 'draft' || doc.status === 'published' || doc.status === 'archived') 
      ? doc.status as 'draft' | 'published' | 'archived'
      : 'published',
    stats: transformStats(doc.stats),
    category: doc.category,
    featuredImage: doc.featuredImage || undefined,
    publishedAt: doc.publishedAt ? toISOString(doc.publishedAt) : undefined,
    metaDescription: doc.metaDescription || undefined,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    interactions: (doc.interactions && typeof doc.interactions === 'object' && 'isLiked' in doc.interactions)
      ? doc.interactions as z.infer<typeof UserInteractionsSchema>
      : (doc.isLikedByUser !== undefined || doc.isBookmarkedByUser !== undefined ? {
          isLiked: Boolean(doc.isLikedByUser),
          isBookmarked: Boolean(doc.isBookmarkedByUser),
          isShared: false
        } : undefined)
  }
})

// ============================================================================
// WIKI GUIDE SCHEMAS
// ============================================================================

export const WikiGuideSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500),
  slug: z.string().min(1),
  author: UserRefSchema,
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  stats: ContentStatsSchema.extend({
    helpfulsCount: z.number().default(0)
  }),
  category: z.enum(['getting-started', 'gameplay', 'features', 'community']).default('getting-started'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimatedTime: z.string(),
  icon: z.string().optional(),
  featuredImage: z.string().nullable().optional(),
  version: z.number().default(1),
  lastReviewDate: z.string().datetime().optional(),
  reviewedBy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  interactions: UserInteractionsSchema.extend({
    isHelpful: z.boolean().optional()
  }).optional()
})

export const MongoWikiGuideSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.union([z.string(), z.object({}).passthrough()]).optional(),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  author: z.union([
    z.instanceof(ObjectId),
    z.object({
      _id: z.instanceof(ObjectId).optional(),
      id: z.string().optional(),
      username: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      avatar: z.string().optional()
    })
  ]).optional(),
  authorDetails: z.array(z.object({
    _id: z.instanceof(ObjectId).optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional()
  })).optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  stats: z.object({
    viewsCount: z.number().optional(),
    viewCount: z.number().optional(),
    likesCount: z.number().optional(),
    likeCount: z.number().optional(),
    bookmarksCount: z.number().optional(),
    saveCount: z.number().optional(),
    sharesCount: z.number().optional(),
    shareCount: z.number().optional(),
    helpfulsCount: z.number().optional()
  }).optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  estimatedTime: z.string().optional(),
  featuredImage: z.union([z.string(), z.null()]).optional(),
  version: z.number().optional(),
  lastReviewDate: z.union([z.date(), z.string()]).optional(),
  reviewedBy: z.string().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  isLikedByUser: z.boolean().optional(),
  isBookmarkedByUser: z.boolean().optional(),
  isHelpfulByUser: z.boolean().optional(),
  interactions: z.unknown().optional(),
  isDeleted: z.boolean().optional()
})
.transform((doc): z.infer<typeof WikiGuideSchema> => {
  const transformAuthor = (author: unknown, authorDetails?: Array<Record<string, unknown>>): z.infer<typeof UserRefSchema> => {
    if (!author) {
      return { id: '', name: 'Unknown User' }
    }
    
    // Handle embedded author object (check first and most specifically)
    if (typeof author === 'object' && author !== null && 
        'id' in author && 'name' in author && !('_id' in author)) {
      const authorObj = author as { id: unknown; name: unknown; avatar?: unknown }
      return {
        id: String(authorObj.id),
        name: String(authorObj.name),
        avatar: authorObj.avatar as string | undefined
      }
    }
    
    // If we have authorDetails from lookup, use that
    if (authorDetails && authorDetails.length > 0) {
      const authorData = authorDetails[0]
      const _id = authorData._id as ObjectId | string | undefined
      const id = authorData.id as string | undefined
      const profile = authorData.profile as { displayName?: string; avatar?: string } | undefined
      const username = authorData.username as string | undefined
      const name = authorData.name as string | undefined
      const email = authorData.email as string | undefined
      const avatar = authorData.avatar as string | undefined
      
      return {
        id: (_id ? _id.toString() : id) || '',
        name: profile?.displayName || username || name || email || 'Unknown User',
        avatar: profile?.avatar || avatar
      }
    }
    
    // Handle string author ID (no lookup data available)
    if (typeof author === 'string') {
      return {
        id: author,
        name: 'Unknown User',
        avatar: undefined
      }
    }
    
    // Handle ObjectId or Buffer types
    if (author && typeof author === 'object' && ('_id' in author || 'toString' in author)) {
      const authorObj = author as { _id?: ObjectId | string; toString?: () => string }
      return {
        id: authorObj._id ? authorObj._id.toString() : (authorObj.toString ? authorObj.toString() : ''),
        name: 'Unknown User',
        avatar: undefined
      }
    }
    
    // Handle author object without _id (already processed)
    if (typeof author === 'object' && author !== null && !('_id' in author) && 'id' in author) {
      const authorObj = author as { id: unknown; name?: unknown; avatar?: unknown }
      return {
        id: typeof authorObj.id === 'string' ? authorObj.id : String(authorObj.id || ''),
        name: String(authorObj.name || 'Unknown User'),
        avatar: authorObj.avatar as string | undefined
      }
    }
    
    // Fallback - use author directly if it has user data
    if (author && typeof author === 'object') {
      const authorObj = author as Record<string, unknown>
      const _id = authorObj._id as ObjectId | string | undefined
      const id = authorObj.id as string | undefined
      const profile = authorObj.profile as { displayName?: string; avatar?: string } | undefined
      const username = authorObj.username as string | undefined
      const name = authorObj.name as string | undefined
      const email = authorObj.email as string | undefined
      const avatar = authorObj.avatar as string | undefined
      
      return {
        id: (_id ? _id.toString() : id) || '',
        name: profile?.displayName || username || name || email || 'Unknown User',
        avatar: profile?.avatar || avatar
      }
    }
    
    return { id: '', name: 'Unknown User' }
  }

  const transformStats = (stats: unknown) => {
    const statsObj = stats as Record<string, unknown> | null | undefined
    return {
      viewsCount: Number(statsObj?.viewsCount || statsObj?.viewCount || 0),
      likesCount: Number(statsObj?.likesCount || statsObj?.likeCount || 0),
      bookmarksCount: Number(statsObj?.bookmarksCount || 0),
      sharesCount: Number(statsObj?.sharesCount || statsObj?.shareCount || 0),
      helpfulsCount: Number(statsObj?.helpfulsCount || 0)
    }
  }

  const toISOString = (date: Date | string | undefined): string => {
    if (date instanceof Date) return date.toISOString()
    if (typeof date === 'string') return date
    return new Date().toISOString()
  }

  return {
    id: doc._id?.toString() || doc.id || '',
    title: doc.title || 'Untitled',
    content: typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content || {}),
    excerpt: doc.excerpt || '',
    slug: doc.slug || '',
    author: transformAuthor(doc.author, doc.authorDetails),
    tags: doc.tags || [],
    status: (doc.status === 'draft' || doc.status === 'published' || doc.status === 'archived') 
      ? doc.status as 'draft' | 'published' | 'archived'
      : 'published',
    stats: transformStats(doc.stats),
    category: (doc.category === 'getting-started' || doc.category === 'gameplay' || doc.category === 'features' || doc.category === 'community') 
      ? doc.category as 'getting-started' | 'gameplay' | 'features' | 'community'
      : 'getting-started',
    difficulty: (doc.difficulty === 'beginner' || doc.difficulty === 'intermediate' || doc.difficulty === 'advanced') 
      ? doc.difficulty as 'beginner' | 'intermediate' | 'advanced'
      : 'beginner',
    estimatedTime: doc.estimatedTime || '10 minutes',
    featuredImage: doc.featuredImage || undefined,
    version: doc.version || 1,
    lastReviewDate: doc.lastReviewDate ? toISOString(doc.lastReviewDate) : undefined,
    reviewedBy: doc.reviewedBy || undefined,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    interactions: doc.interactions 
      ? doc.interactions as z.infer<typeof UserInteractionsSchema> : (doc.isLikedByUser !== undefined ? {
      isLiked: doc.isLikedByUser || false,
      isBookmarked: doc.isBookmarkedByUser || false,
      isShared: false,
      isHelpful: doc.isHelpfulByUser || false
    } : undefined)
  }
})

// ============================================================================
// TYPE EXPORTS (Automatic Inference)
// ============================================================================

export type User = z.infer<typeof UserSchema>
export type ForumPost = z.infer<typeof ForumPostSchema>
export type BlogPost = z.infer<typeof BlogPostSchema>
export type WikiGuide = z.infer<typeof WikiGuideSchema>
export type UserRef = z.infer<typeof UserRefSchema>
export type ContentStats = z.infer<typeof ContentStatsSchema>
export type UserInteractions = z.infer<typeof UserInteractionsSchema>

// MongoDB document types
export type MongoUser = z.input<typeof MongoUserSchema>
export type MongoForumPost = z.input<typeof MongoForumPostSchema>
export type MongoBlogPost = z.input<typeof MongoBlogPostSchema>
export type MongoWikiGuide = z.input<typeof MongoWikiGuideSchema>