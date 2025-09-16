/**
 * Common Schema Utilities
 * 
 * Shared validation schemas used across all content modules (blog, wiki, forum, dex)
 * to ensure consistency and eliminate duplication.
 */

import { z } from 'zod'
import { paginationSchema } from '@/lib/utils/validation'

// ============================================================================
// CONTENT VALIDATION HELPERS
// ============================================================================

/**
 * HTML content validation with consistent rules across all modules
 */
export const htmlContentSchema = z.string()
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

/**
 * Reply content validation (shorter than main content)
 */
export const replyContentSchema = z.string()
  .min(1, 'Content is required')
  .max(5000, 'Reply content must be less than 5000 characters')
  .refine(
    (content) => {
      const textContent = content.replace(/<[^>]*>/g, '').trim()
      return textContent.length > 0
    },
    { message: 'Reply must contain text, not just HTML tags' }
  )

/**
 * Title validation with consistent rules
 */
export const titleSchema = z.string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters')
  .trim()
  .refine(
    (title) => title.length >= 3,
    { message: 'Title must be at least 3 characters long' }
  )

/**
 * Excerpt validation with consistent rules
 */
export const excerptSchema = z.string()
  .min(1, 'Excerpt is required')
  .max(500, 'Excerpt must be less than 500 characters')

/**
 * Optional excerpt validation
 */
export const optionalExcerptSchema = excerptSchema.optional()

/**
 * Meta description validation
 */
export const metaDescriptionSchema = z.string()
  .max(160, 'Meta description must be less than 160 characters')
  .optional()

/**
 * Tags validation with consistent rules
 */
export const tagsSchema = z.array(
  z.string()
    .min(1, 'Tag cannot be empty')
    .max(30, 'Tag must be less than 30 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Tags can only contain letters, numbers, spaces, and hyphens')
).max(10, 'Maximum 10 tags allowed').optional().default([])

/**
 * Status enum for all content types
 */
export const statusSchema = z.enum(['published', 'draft', 'archived'])

/**
 * Content status with default value
 */
export const defaultStatusSchema = statusSchema.optional().default('published')

// ============================================================================
// USER REFERENCE SCHEMAS
// ============================================================================

/**
 * User reference schema used across all content types
 */
export const userRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional()
})

// ============================================================================
// PAGINATION AND FILTERING
// ============================================================================

/**
 * Base query schema for all content types
 */
export const baseQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: statusSchema.optional(),
  sortBy: z.enum(['latest', 'popular', 'views', 'oldest']).default('latest')
})

/**
 * Extended query schema with author and tags
 */
export const extendedQuerySchema = baseQuerySchema.extend({
  author: z.string().optional(),
  tags: z.array(z.string()).optional()
})

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

/**
 * Base stats schema used by all content types
 */
export const baseStatsSchema = z.object({
  viewsCount: z.number().min(0).default(0),
  likesCount: z.number().min(0).default(0),
  bookmarksCount: z.number().min(0).default(0),
  sharesCount: z.number().min(0).default(0)
})

/**
 * Extended stats schema with helpfulness (for wiki)
 */
export const extendedStatsSchema = baseStatsSchema.extend({
  helpfulsCount: z.number().min(0).default(0)
})

/**
 * Forum-specific stats schema
 */
export const forumStatsSchema = baseStatsSchema.extend({
  repliesCount: z.number().min(0).default(0)
})

// ============================================================================
// INTERACTION SCHEMAS
// ============================================================================

/**
 * Base interaction state schema
 */
export const baseInteractionSchema = z.object({
  isLiked: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  isShared: z.boolean().default(false)
})

/**
 * Extended interaction schema with helpfulness
 */
export const extendedInteractionSchema = baseInteractionSchema.extend({
  isHelpful: z.boolean().default(false)
})

// ============================================================================
// COMMON FIELD PATTERNS
// ============================================================================

/**
 * Category validation for string-based categories
 */
export const categoryStringSchema = z.string().min(1, 'Category is required')

/**
 * Slug validation
 */
export const slugSchema = z.string().min(1, 'Slug is required')

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL')

/**
 * Optional URL validation
 */
export const optionalUrlSchema = urlSchema.optional()

// ============================================================================
// COMMON TRANSFORMATIONS
// ============================================================================

/**
 * MongoDB ObjectId transformation helper
 */
export const mongoIdTransform = (doc: { _id: unknown; [key: string]: unknown }) => ({
  ...doc,
  id: doc._id ? (doc._id as { toString(): string }).toString() : ''
})

// ============================================================================
// VALIDATION ERROR HELPERS
// ============================================================================

/**
 * Extract validation errors from Zod error
 */
export function extractValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  )
}

/**
 * Format validation errors as single string
 */
export function formatValidationErrors(error: z.ZodError): string {
  return extractValidationErrors(error).join(', ')
}