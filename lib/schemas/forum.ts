/**
 * Forum Schema Definitions
 * 
 * Complete schema-first architecture for forum module following dex pattern.
 * Includes MongoDB document schemas, validation, and type generation.
 */

import { z } from 'zod'
import { 
  titleSchema,
  htmlContentSchema,
  replyContentSchema,
  metaDescriptionSchema,
  tagsSchema,
  userRefSchema,
  forumStatsSchema as baseForumStatsSchema,
  baseInteractionSchema,
  categoryStringSchema,
  baseQuerySchema
} from './common'

// ============================================================================
// FORUM POST SCHEMAS (API and Form Validation)
// ============================================================================

export const createForumPostSchema = z.object({
  title: titleSchema,
  content: htmlContentSchema,
  metaDescription: metaDescriptionSchema,
  category: categoryStringSchema,
  tags: tagsSchema,
  isPinned: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
})

export const updateForumPostSchema = createForumPostSchema.partial()

export const createReplySchema = z.object({
  content: replyContentSchema,
  postId: z.string().min(1, 'Post ID is required'),
  replyToId: z.string().optional(),
})

export const updateReplySchema = z.object({
  content: replyContentSchema,
})

export const forumFiltersSchema = baseQuerySchema.extend({
  category: z.string().optional(),
  status: z.enum(['active', 'locked', 'all']).default('active')
})

export const adminPostActionSchema = z.object({
  action: z.enum(['pin', 'unpin', 'lock', 'unlock', 'delete', 'restore']),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
})

// ============================================================================
// MONGODB DOCUMENT SCHEMAS (Runtime Validation and Type Generation)
// ============================================================================

export const MongoForumPostSchema = z.object({
  _id: z.any(), // ObjectId
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  metaDescription: z.string().optional().nullable(),
  category: z.string(),
  categoryName: z.string().optional(), // Forum-specific: category display name
  author: userRefSchema,
  stats: baseForumStatsSchema,
  interactions: baseInteractionSchema.optional(),
  tags: z.array(z.string()),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
}).transform((doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  slug: doc.slug,
  content: doc.content,
  metaDescription: doc.metaDescription,
  category: doc.category,
  categoryName: doc.categoryName,
  author: doc.author,
  stats: doc.stats,
  interactions: doc.interactions,
  tags: doc.tags,
  isPinned: doc.isPinned,
  isLocked: doc.isLocked,
  isDeleted: doc.isDeleted,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
}))

export const MongoForumReplySchema = z.object({
  _id: z.any(),
  content: z.string(),
  postId: z.string(),
  replyToId: z.string().optional().nullable(),
  author: userRefSchema,
  stats: z.object({
    likesCount: z.number().default(0),
    dislikesCount: z.number().default(0)
  }),
  interactions: z.object({
    isLiked: z.boolean().default(false),
    isDisliked: z.boolean().default(false)
  }).optional(),
  isDeleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
}).transform((doc) => ({
  id: doc._id.toString(),
  content: doc.content,
  postId: doc.postId,
  replyToId: doc.replyToId,
  author: doc.author,
  stats: doc.stats,
  interactions: doc.interactions,
  isDeleted: doc.isDeleted,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
}))

export const MongoForumCategorySchema = z.object({
  _id: z.any(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  stats: z.object({
    postsCount: z.number().default(0),
    viewsCount: z.number().default(0)
  }),
  createdAt: z.string(),
  updatedAt: z.string()
}).transform((doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  color: doc.color,
  isActive: doc.isActive,
  order: doc.order,
  stats: doc.stats,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
}))

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateForumPostData = z.infer<typeof createForumPostSchema>
export type UpdateForumPostData = z.infer<typeof updateForumPostSchema>
export type CreateReplyData = z.infer<typeof createReplySchema>
export type UpdateReplyData = z.infer<typeof updateReplySchema>
export type ForumFilters = z.infer<typeof forumFiltersSchema>
export type AdminPostActionData = z.infer<typeof adminPostActionSchema>

export type ForumPost = z.infer<typeof MongoForumPostSchema>
export type ForumReply = z.infer<typeof MongoForumReplySchema>
export type ForumCategory = z.infer<typeof MongoForumCategorySchema>

// Additional schemas for API routes
export const forumSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export const forumQuerySchema = forumFiltersSchema
export const updatePostSchema = updateForumPostSchema

export type ForumSlugData = z.infer<typeof forumSlugSchema>
export type ForumQueryData = z.infer<typeof forumQuerySchema>
export type UpdatePostData = z.infer<typeof updatePostSchema>