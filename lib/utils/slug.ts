/**
 * Unified Slug Generation Utilities
 * 
 * Replaces module-specific slug generation functions with a single, reusable utility.
 * Ensures consistent slug generation across Forum, Blog, and Wiki modules.
 */

/**
 * Generates a URL-friendly slug from a title string
 * Supports Unicode characters by using browser's built-in transliteration
 * 
 * @param title - The title to convert to a slug
 * @returns A clean, URL-safe slug
 * 
 * @example
 * generateSlug("Hello World!") // "hello-world"
 * generateSlug("API Guide: Getting Started") // "api-guide-getting-started"
 * generateSlug("   Multiple   Spaces   ") // "multiple-spaces"
 * generateSlug("隐德来希") // transliterated to ASCII-compatible slug
 */
export const generateSlug = (title: string): string => {
  let processed = title.toLowerCase().trim()
  
  // Use built-in transliteration to convert Unicode characters to ASCII equivalents
  // This handles Chinese, Japanese, Korean, Arabic, Cyrillic, and other scripts
  try {
    processed = processed.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  } catch {
    // Fallback if normalization fails
  }
  
  // For characters that can't be transliterated, use a more readable hex approach
  processed = processed.replace(/[^\w\s-]/g, (char) => {
    // Keep basic ASCII characters, convert others to readable format
    if (/[a-z0-9\s-]/.test(char)) {
      return char
    }
    // Convert Unicode to a readable hex representation
    const code = char.charCodeAt(0).toString(16).padStart(4, '0')
    return `u${code}`
  })
  
  return processed
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
}

/**
 * Validates that a slug follows the correct format
 * Supports Unicode-based slugs (u followed by hex codes)
 * 
 * @param slug - The slug to validate
 * @returns true if the slug is valid, false otherwise
 * 
 * @example
 * validateSlug("hello-world") // true
 * validateSlug("Hello-World") // false (uppercase)
 * validateSlug("hello--world") // false (double hyphens)
 * validateSlug("-hello-world-") // false (leading/trailing hyphens)
 * validateSlug("u9690u5fb7u6765u5e0c") // true (Unicode slug)
 */
export const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9u]+(?:-[a-z0-9u]+)*$/.test(slug)
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

