/**
 * Unified Slug Generation Utilities
 * 
 * Replaces module-specific slug generation functions with a single, reusable utility.
 * Ensures consistent slug generation across Forum, Blog, and Wiki modules.
 */

/**
 * Generates a URL-friendly slug from a title string
 * 
 * @param title - The title to convert to a slug
 * @returns A clean, URL-safe slug
 * 
 * @example
 * generateSlug("Hello World!") // "hello-world"
 * generateSlug("API Guide: Getting Started") // "api-guide-getting-started"
 * generateSlug("   Multiple   Spaces   ") // "multiple-spaces"
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validates that a slug follows the correct format
 * 
 * @param slug - The slug to validate
 * @returns true if the slug is valid, false otherwise
 * 
 * @example
 * validateSlug("hello-world") // true
 * validateSlug("Hello-World") // false (uppercase)
 * validateSlug("hello--world") // false (double hyphens)
 * validateSlug("-hello-world-") // false (leading/trailing hyphens)
 */
export const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Generates a unique slug with counter suffix
 * Used internally by DAL classes to ensure slug uniqueness
 * 
 * @param baseSlug - The base slug
 * @param counter - The counter to append
 * @returns The slug with counter suffix
 * 
 * @example
 * generateSlugWithCounter("hello-world", 1) // "hello-world-1"
 * generateSlugWithCounter("api-guide", 5) // "api-guide-5"
 */
export const generateSlugWithCounter = (baseSlug: string, counter: number): string => {
  return `${baseSlug}-${counter}`
}

/**
 * Legacy compatibility exports
 * @deprecated Use generateSlug() instead
 * These will be removed in a future version
 */
export const generateForumSlug = generateSlug
export const generateBlogSlug = generateSlug  
export const generateWikiSlug = generateSlug
export const validateBlogSlug = validateSlug
export const validateWikiSlug = validateSlug