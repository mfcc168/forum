/**
 * Blog Schema Definitions
 * 
 * Complete schema-first architecture for blog module following dex pattern.
 * Includes MongoDB document schemas, validation, and type generation.
 */

import { z } from 'zod'
import { 
  titleSchema,
  htmlContentSchema,
  excerptSchema,
  metaDescriptionSchema,
  tagsSchema,
  defaultStatusSchema,
  userRefSchema,
  baseStatsSchema,
  baseInteractionSchema,
  categoryStringSchema,
  baseQuerySchema
} from './common'

// ============================================================================
// BLOG POST SCHEMAS (API and Form Validation)
// ============================================================================

export const createBlogPostSchema = z.object({
  title: titleSchema,
  content: htmlContentSchema,
  excerpt: excerptSchema,
  metaDescription: metaDescriptionSchema,
  category: categoryStringSchema,
  tags: tagsSchema,
  status: defaultStatusSchema,
  featuredImage: z.string().url('Invalid image URL').optional(),
})

export const updateBlogPostSchema = createBlogPostSchema.partial()

export const blogFiltersSchema = baseQuerySchema.extend({
  category: z.string().optional(),
})

// ============================================================================
// MONGODB DOCUMENT SCHEMAS (Runtime Validation and Type Generation)
// ============================================================================

export const MongoBlogPostSchema = z.object({
  _id: z.any(), // ObjectId
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string(),
  metaDescription: z.string().optional().nullable(),
  category: z.string(),
  author: userRefSchema,
  stats: baseStatsSchema,
  interactions: baseInteractionSchema.optional(),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  featuredImage: z.string().optional().nullable(),
  isDeleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional().nullable()
}).transform((doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  slug: doc.slug,
  content: doc.content,
  excerpt: doc.excerpt,
  metaDescription: doc.metaDescription,
  category: doc.category,
  author: doc.author,
  stats: doc.stats,
  interactions: doc.interactions,
  tags: doc.tags,
  status: doc.status,
  featuredImage: doc.featuredImage,
  isDeleted: doc.isDeleted,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  publishedAt: doc.publishedAt
}))

// Export the inferred type from the transformed schema
export type BlogPost = z.infer<typeof MongoBlogPostSchema>

export const MongoBlogCategorySchema = z.object({
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

export type BlogCategory = z.infer<typeof MongoBlogCategorySchema>

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateBlogPostData = z.infer<typeof createBlogPostSchema>
export type UpdateBlogPostData = z.infer<typeof updateBlogPostSchema>
export type BlogFilters = z.infer<typeof blogFiltersSchema>

// Additional schemas for API routes
export const blogSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export const blogQuerySchema = blogFiltersSchema

export type BlogSlugData = z.infer<typeof blogSlugSchema>
export type BlogQueryData = z.infer<typeof blogQuerySchema>

// Content validation function for API routes
export function validateBlogContent(data: unknown): { isValid: boolean; errors?: string[] } {
  try {
    createBlogPostSchema.parse(data)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { isValid: false, errors: ['Invalid content format'] }
  }
}