import { z } from 'zod'
import { paginationSchema } from '@/lib/utils/validation'
import { htmlContentSchema } from './common'

// Blog Post Creation Schema (consistent with forum patterns)
export const createBlogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .refine(
      (title) => title.length >= 3,
      { message: 'Title must be at least 3 characters long' }
    ),
  content: htmlContentSchema,
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt must be less than 500 characters'),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
  ).max(10, 'Maximum 10 tags allowed').optional().default([]),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
  featuredImage: z.string().url('Invalid image URL').optional(),
})

export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>

// Blog Post Update Schema
export const updateBlogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .refine(
      (title) => title.length >= 3,
      { message: 'Title must be at least 3 characters long' }
    )
    .optional(),
  content: htmlContentSchema.optional(),
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt must be less than 500 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
  ).max(10, 'Maximum 10 tags allowed').optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
})

export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>

// Blog Query Parameters Schema (consistent with forum pattern)
export const blogQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(['latest', 'popular', 'views']).default('latest'),
  status: z.enum(['published', 'draft', 'archived', 'all']).default('published'),
})

export type BlogQueryData = z.infer<typeof blogQuerySchema>

// Blog Post Interaction Schema (consistent with forum pattern)
export const blogInteractionSchema = z.object({
  interactionType: z.enum(['like', 'bookmark', 'share', 'view']),
  targetId: z.string().min(1),
  targetType: z.enum(['post']).default('post'),
})

export type BlogInteractionData = z.infer<typeof blogInteractionSchema>

// Blog Slug Parameter Schema
export const blogSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export type BlogSlugData = z.infer<typeof blogSlugSchema>

// Note: Legacy response schemas removed - use proper API types from @/lib/types instead

// Blog Category Schema (for admin/internal use - consistent with wiki pattern)
export const blogCategorySchema = z.object({
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

export type BlogCategory = z.infer<typeof blogCategorySchema>

// Blog Categories Response Schema
export const blogCategoriesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(blogCategorySchema),
})

export type BlogCategoriesResponse = z.infer<typeof blogCategoriesResponseSchema>

// Blog Stats Schema
export const blogStatsSchema = z.object({
  totalPosts: z.number(),
  publishedPosts: z.number(),
  draftPosts: z.number(),
  archivedPosts: z.number(),
  totalViews: z.number(),
  totalLikes: z.number(),
  categoriesCount: z.number(),
  averagePostsPerCategory: z.number(),
  mostPopularCategory: z.string().optional(),
  recentActivity: z.object({
    postsToday: z.number(),
    postsThisWeek: z.number(),
    postsThisMonth: z.number(),
  }),
})

export type BlogStats = z.infer<typeof blogStatsSchema>

// Blog Stats Response Schema
export const blogStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: blogStatsSchema,
})

export type BlogStatsResponse = z.infer<typeof blogStatsResponseSchema>

// Validation helpers (consistent with forum patterns)
export { validateSlug, generateSlug } from '@/lib/utils/slug'

// Content validation helpers
export const validateBlogContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!content || content.trim().length === 0) {
    errors.push('Content cannot be empty')
  }
  
  if (content.length > 50000) {
    errors.push('Content must be less than 50,000 characters')
  }
  
  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      errors.push('Content contains potentially unsafe elements')
      break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Blog post status validation
export const isValidBlogStatus = (status: string): status is 'published' | 'draft' | 'archived' => {
  return ['published', 'draft', 'archived'].includes(status)
}

// Export all schemas for easy importing (already exported above)