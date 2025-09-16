/**
 * Wiki Schema Definitions
 * 
 * Complete schema-first architecture for wiki module following dex pattern.
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
  extendedStatsSchema,
  extendedInteractionSchema,
  baseQuerySchema
} from './common'

// ============================================================================
// WIKI GUIDE SCHEMAS (API and Form Validation)
// ============================================================================

export const createWikiGuideSchema = z.object({
  title: titleSchema,
  content: htmlContentSchema,
  excerpt: excerptSchema,
  category: z.enum(['getting-started', 'gameplay', 'features', 'community']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: tagsSchema,
  status: defaultStatusSchema,
  metaDescription: metaDescriptionSchema,
})

export const updateWikiGuideSchema = createWikiGuideSchema.partial()

export const wikiFiltersSchema = baseQuerySchema.extend({
  category: z.enum(['all', 'getting-started', 'gameplay', 'features', 'community']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

// ============================================================================
// MONGODB DOCUMENT SCHEMAS (Runtime Validation and Type Generation)
// ============================================================================

export const MongoWikiGuideSchema = z.object({
  _id: z.any(), // ObjectId
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string(),
  metaDescription: z.string().optional().nullable(),
  category: z.enum(['getting-started', 'gameplay', 'features', 'community']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  author: userRefSchema,
  stats: extendedStatsSchema, // Wiki has helpfulsCount
  interactions: extendedInteractionSchema.optional(), // Wiki has isHelpful
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
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
  difficulty: doc.difficulty,
  author: doc.author,
  stats: doc.stats,
  interactions: doc.interactions,
  tags: doc.tags,
  status: doc.status,
  isDeleted: doc.isDeleted,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  publishedAt: doc.publishedAt
}))

export const MongoWikiCategorySchema = z.object({
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

export type CreateWikiGuideData = z.infer<typeof createWikiGuideSchema>
export type UpdateWikiGuideData = z.infer<typeof updateWikiGuideSchema>
export type WikiFilters = z.infer<typeof wikiFiltersSchema>

export type WikiGuide = z.infer<typeof MongoWikiGuideSchema>
export type WikiCategory = z.infer<typeof MongoWikiCategorySchema>

// Additional schemas for API routes
export const wikiSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export const wikiQuerySchema = wikiFiltersSchema

export type WikiSlugData = z.infer<typeof wikiSlugSchema>
export type WikiQueryData = z.infer<typeof wikiQuerySchema>

// Export stats type for components
export interface WikiStats {
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalUsers: number
  activeUsers: number
  categoriesCount: number
  totalGuides: number
  totalDrafts: number
  averageHelpfulRating: number
  guidesCountByDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number>
  categories: Array<{
    name: string
    slug: string
    postsCount: number
    order: number
  }>
  popularPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    likesCount: number
  }>
  recentPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    createdAt: string
  }>
  mostHelpfulGuides: Array<{
    title: string
    slug: string
    helpfulsCount: number
    difficulty: string
  }>
  recentGuides: Array<{
    title: string
    slug: string
    difficulty: string
    createdAt: string
  }>
}