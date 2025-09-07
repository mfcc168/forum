/**
 * Meta Description Utilities
 * Reusable functions for generating SEO-optimized meta descriptions
 */

export interface MetaDescriptionOptions {
  /** Maximum length for the meta description (default: 160) */
  maxLength?: number
  /** Suffix to add when content is truncated (default: '...') */
  truncateSuffix?: string
  /** Whether to strip HTML tags from content (default: true) */
  stripHtml?: boolean
  /** Whether to clean up whitespace (default: true) */
  cleanWhitespace?: boolean
}

/**
 * Generate an SEO-optimized meta description from content
 * 
 * @param content - The main content to extract description from
 * @param excerpt - Optional excerpt to prioritize over content
 * @param options - Configuration options
 * @returns Generated meta description
 */
export function generateMetaDescription(
  content: string = '',
  excerpt?: string,
  options: MetaDescriptionOptions = {}
): string {
  const {
    maxLength = 160,
    truncateSuffix = '...',
    stripHtml = true,
    cleanWhitespace = true
  } = options

  // Prioritize excerpt over content
  let text = excerpt || content || ''

  // Strip HTML tags if enabled
  if (stripHtml) {
    text = text.replace(/<[^>]*>/g, '')
  }

  // Clean up whitespace if enabled
  if (cleanWhitespace) {
    text = text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim() // Remove leading/trailing whitespace
  }

  // Return empty string if no meaningful content
  if (!text) {
    return ''
  }

  // Truncate if necessary
  if (text.length <= maxLength) {
    return text
  }

  // Find the last complete word within the limit
  const truncateLength = maxLength - truncateSuffix.length
  const truncated = text.substring(0, truncateLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  // If we found a space and it's not too close to the beginning, cut at the word boundary
  if (lastSpaceIndex > truncateLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + truncateSuffix
  }
  
  // Otherwise, cut at the character limit
  return truncated + truncateSuffix
}

/**
 * Generate meta description specifically for blog posts
 */
export function generateBlogMetaDescription(
  content: string,
  excerpt?: string,
  options?: MetaDescriptionOptions
): string {
  return generateMetaDescription(content, excerpt, {
    maxLength: 160,
    ...options
  })
}

/**
 * Generate meta description specifically for forum posts
 */
export function generateForumMetaDescription(
  content: string,
  excerpt?: string,
  options?: MetaDescriptionOptions
): string {
  return generateMetaDescription(content, excerpt, {
    maxLength: 160, // Consistent with other modules
    ...options
  })
}

/**
 * Generate meta description specifically for wiki guides
 */
export function generateWikiMetaDescription(
  content: string,
  excerpt?: string,
  options?: MetaDescriptionOptions
): string {
  return generateMetaDescription(content, excerpt, {
    maxLength: 160,
    ...options
  })
}

/**
 * Generate meta description with fallback content
 * Useful when you have multiple content sources to try
 */
export function generateMetaDescriptionWithFallbacks(
  sources: Array<string | undefined>,
  options?: MetaDescriptionOptions
): string {
  for (const source of sources) {
    if (source && source.trim()) {
      const result = generateMetaDescription(source, undefined, options)
      if (result) {
        return result
      }
    }
  }
  return ''
}

/**
 * Validate if a meta description meets SEO best practices
 */
export function validateMetaDescription(metaDescription: string): {
  isValid: boolean
  warnings: string[]
  suggestions: string[]
} {
  const warnings: string[] = []
  const suggestions: string[] = []
  
  const length = metaDescription.length
  
  // Check length
  if (length === 0) {
    warnings.push('Meta description is empty')
    suggestions.push('Add a meta description to improve SEO')
  } else if (length < 120) {
    warnings.push('Meta description is too short')
    suggestions.push('Consider expanding to 120-160 characters for better SEO')
  } else if (length > 160) {
    warnings.push('Meta description is too long')
    suggestions.push('Shorten to 160 characters or less to avoid truncation in search results')
  }
  
  // Check for duplicate words (potential keyword stuffing)
  const words = metaDescription.toLowerCase().split(/\s+/)
  const wordCounts = words.reduce((acc, word) => {
    if (word.length > 3) { // Only check meaningful words
      acc[word] = (acc[word] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  
  const repeatedWords = Object.entries(wordCounts)
    .filter(([, count]) => count > 2)
    .map(([word]) => word)
  
  if (repeatedWords.length > 0) {
    warnings.push(`Repeated words detected: ${repeatedWords.join(', ')}`)
    suggestions.push('Avoid repeating keywords too frequently')
  }
  
  // Check for action words (good for CTR)
  const actionWords = ['learn', 'discover', 'find', 'get', 'start', 'explore', 'understand', 'master']
  const hasActionWords = actionWords.some(word => 
    metaDescription.toLowerCase().includes(word)
  )
  
  if (!hasActionWords) {
    suggestions.push('Consider adding action words like "learn", "discover", or "explore" to improve click-through rates')
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  }
}