import { z } from 'zod'
import { paginationSchema } from '@/lib/utils/validation'
import { htmlContentSchema, replyContentSchema } from './common'

// Enhanced Forum Post Creation Schema
export const createForumPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .refine(
      (title) => title.length >= 3,
      { message: 'Title must be at least 3 characters long' }
    ),
  content: htmlContentSchema,
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  category: z.string()
    .min(1, 'Category is required')
    .refine(
      (category) => /^[a-zA-Z0-9\s&-]+$/.test(category),
      { message: 'Category contains invalid characters' }
    ),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
  ).max(10, 'Maximum 10 tags allowed').optional().default([]),
  isPinned: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
})

export type CreateForumPostData = z.infer<typeof createForumPostSchema>

// Forum Query Schema for consistent API filtering
export const forumQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(['latest', 'popular', 'replies', 'oldest']).default('latest'),
  status: z.enum(['active', 'locked', 'all']).default('active')
})

export type ForumQueryData = z.infer<typeof forumQuerySchema>

export { generateSlug } from '@/lib/utils/slug'

// Enhanced Forum Reply Creation Schema
export const createReplySchema = z.object({
  content: replyContentSchema,
  postId: z.string()
    .min(1, 'Post ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  replyToId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid reply ID format')
    .optional(),
})

export type CreateReplyData = z.infer<typeof createReplySchema>

// Enhanced Post Update Schema
export const updateForumPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .refine(
      (title) => title.length >= 3,
      { message: 'Title must be at least 3 characters long' }
    ).optional(),
  content: htmlContentSchema.optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
  ).max(10, 'Maximum 10 tags allowed').optional(),
})

export type UpdatePostData = z.infer<typeof updateForumPostSchema>

// Reply Update Schema
export const updateReplySchema = z.object({
  content: replyContentSchema,
})

export type UpdateReplyData = z.infer<typeof updateReplySchema>

// Admin-specific Post Operations Schema
export const adminPostActionSchema = z.object({
  action: z.enum(['pin', 'unpin', 'lock', 'unlock', 'delete', 'restore']),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
})

export type AdminPostActionData = z.infer<typeof adminPostActionSchema>

// Post Interaction Schema
export const postInteractionSchema = z.object({
  interactionType: z.enum(['like', 'dislike', 'bookmark', 'share', 'report', 'view']),
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID format'),
  targetType: z.enum(['post', 'reply']),
})

export type PostInteractionData = z.infer<typeof postInteractionSchema>

// Delete operation schema
export const deletePostSchema = z.object({
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
  softDelete: z.boolean().optional().default(true),
})

export type DeletePostData = z.infer<typeof deletePostSchema>

// Note: Legacy response schemas removed - use proper API types from @/lib/types instead

// Forum Category Schema (for admin/internal use - consistent with blog/wiki pattern)
export const forumCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  postCount: z.number().default(0),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: z.object({
    postsCount: z.number(),
    viewsCount: z.number(),
  }),
})

export type ForumCategory = z.infer<typeof forumCategorySchema>

// Forum Categories Response Schema
export const forumCategoriesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(forumCategorySchema),
})

export type ForumCategoriesResponse = z.infer<typeof forumCategoriesResponseSchema>

// Forum Stats Schema (consistent with blog/wiki pattern)
export const forumStatsSchema = z.object({
  totalPosts: z.number(),
  publishedPosts: z.number(),
  activePosts: z.number(),
  lockedPosts: z.number(),
  totalReplies: z.number(),
  totalViews: z.number(),
  totalLikes: z.number(),
  categoriesCount: z.number(),
  averagePostsPerCategory: z.number(),
  mostActiveCategory: z.string().optional(),
  recentActivity: z.object({
    postsToday: z.number(),
    postsThisWeek: z.number(),
    postsThisMonth: z.number(),
    repliesToday: z.number(),
    repliesThisWeek: z.number(),
    repliesThisMonth: z.number(),
  }),
})

export type ForumStats = z.infer<typeof forumStatsSchema>

// Forum Stats Response Schema
export const forumStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: forumStatsSchema,
})

export type ForumStatsResponse = z.infer<typeof forumStatsResponseSchema>

// Forum Post Slug Parameter Schema (consistent with blog/wiki)
export const forumSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export type ForumSlugData = z.infer<typeof forumSlugSchema>