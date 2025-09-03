import { z } from 'zod'
import { paginationSchema } from '@/lib/utils/validation'

// Content validation helpers
const htmlContentSchema = z.string()
  .min(1, 'Content is required')
  .max(50000, 'Content must be less than 50000 characters')
  .refine(
    (content) => {
      // Basic HTML validation - ensure content has meaningful text
      const textContent = content.replace(/<[^>]*>/g, '').trim()
      return textContent.length > 0
    },
    { message: 'Content must contain text, not just HTML tags' }
  )

const replyContentSchema = z.string()
  .min(1, 'Content is required')
  .max(5000, 'Reply content must be less than 5000 characters')
  .refine(
    (content) => {
      const textContent = content.replace(/<[^>]*>/g, '').trim()
      return textContent.length > 0
    },
    { message: 'Reply must contain text, not just HTML tags' }
  )

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

// DEPRECATED: Use generateSlug from @/lib/utils/slug instead
// This function will be removed in a future version
export { generateSlug as generateForumSlug } from '@/lib/utils/slug'

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