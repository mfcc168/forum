import { z } from 'zod'

// Content validation helper (consistent with forum/blog)
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

// Wiki Guide Creation Schema (consistent with blog patterns)
export const createWikiGuideSchema = z.object({
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
  category: z.enum(['getting-started', 'gameplay', 'features', 'community']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
  ).max(10, 'Maximum 10 tags allowed').optional().default([]),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
})

export type CreateWikiGuideData = z.infer<typeof createWikiGuideSchema>

// Wiki Guide Update Schema
export const updateWikiGuideSchema = z.object({
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
  category: z.enum(['getting-started', 'gameplay', 'features', 'community']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.array(
    z.string()
      .min(1, 'Tag cannot be empty')
      .max(30, 'Tag must be less than 30 characters')
      .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
  ).max(10, 'Maximum 10 tags allowed').optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
})

export type UpdateWikiGuideData = z.infer<typeof updateWikiGuideSchema>

// Wiki Query Parameters Schema (consistent with blog/forum)
export const wikiQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.enum(['getting-started', 'gameplay', 'features', 'community', 'all']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(['latest', 'popular', 'views', 'helpful']).default('latest'),
  status: z.enum(['published', 'draft', 'archived', 'all']).default('published'),
})

export type WikiQueryData = z.infer<typeof wikiQuerySchema>

// Wiki Guide Interaction Schema
export const wikiInteractionSchema = z.object({
  interactionType: z.enum(['like', 'bookmark', 'helpful', 'share', 'view']),
  guideSlug: z.string().min(1),
})

export type WikiInteractionData = z.infer<typeof wikiInteractionSchema>

// Wiki Slug Parameter Schema
export const wikiSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export type WikiSlugData = z.infer<typeof wikiSlugSchema>

// Note: Legacy response schemas removed - use proper API types from @/lib/types instead

// Wiki Category Schema (for admin/internal use)
export const wikiCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  guideCount: z.number().default(0),
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

export type WikiCategory = z.infer<typeof wikiCategorySchema>

// Wiki Categories Response Schema
export const wikiCategoriesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(wikiCategorySchema),
})

export type WikiCategoriesResponse = z.infer<typeof wikiCategoriesResponseSchema>

// Wiki Stats Schema
export const wikiStatsSchema = z.object({
  totalGuides: z.number(),
  totalContent: z.number(),
  publishedGuides: z.number(),
  draftGuides: z.number(),
  archivedGuides: z.number(),
  totalViews: z.number(),
  totalLikes: z.number(),
  totalHelpful: z.number(),
  categoriesCount: z.number(),
  totalUsers: z.number(),
  averageRating: z.number(),
  categories: z.array(wikiCategorySchema),
  popularGuides: z.array(z.object({
    title: z.string(),
    slug: z.string(),
    views: z.number(),
    difficulty: z.string(),
    category: z.string().optional(),
  })),
  recentlyUpdated: z.array(z.object({
    title: z.string(),
    slug: z.string(),
    updatedAt: z.string(),
    author: z.string(),
  })),
  mostHelpful: z.array(z.object({
    title: z.string(),
    slug: z.string(),
    helpful: z.number(),
    difficulty: z.string(),
  })),
})

export type WikiStats = z.infer<typeof wikiStatsSchema>

// Wiki Stats Response Schema
export const wikiStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: wikiStatsSchema,
})

export type WikiStatsResponse = z.infer<typeof wikiStatsResponseSchema>

// Validation helpers (consistent with blog patterns)
// DEPRECATED: Use validateSlug and generateSlug from @/lib/utils/slug instead
// These functions will be removed in a future version
export { validateSlug as validateWikiSlug, generateSlug as generateWikiSlug } from '@/lib/utils/slug'

// Content validation helpers
export const validateWikiContent = (content: string): { isValid: boolean; errors: string[] } => {
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

// Wiki guide status validation
export const isValidWikiStatus = (status: string): status is 'published' | 'draft' | 'archived' => {
  return ['published', 'draft', 'archived'].includes(status)
}

// Wiki category validation
export const isValidWikiCategory = (category: string): category is 'getting-started' | 'gameplay' | 'features' | 'community' => {
  return ['getting-started', 'gameplay', 'features', 'community'].includes(category)
}

// Wiki difficulty validation
export const isValidWikiDifficulty = (difficulty: string): difficulty is 'beginner' | 'intermediate' | 'advanced' => {
  return ['beginner', 'intermediate', 'advanced'].includes(difficulty)
}