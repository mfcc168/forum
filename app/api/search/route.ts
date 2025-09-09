import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import type { ServerUser } from '@/lib/types'
import { z } from 'zod'

// Basic searchable content interface (for relevance scoring)
interface SearchableContent {
  title: string
  excerpt: string
  content?: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  category: string
  tags?: string[]
  stats: {
    viewsCount: number
    likesCount: number
    repliesCount?: number
  }
  createdAt?: string
}

// Search result item interface
interface SearchResultItem {
  id: string
  module: 'forum' | 'blog' | 'wiki'
  type: 'post' | 'guide' | 'reply'
  title: string
  excerpt: string
  content?: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  category: string
  tags: string[]
  stats: {
    viewsCount: number
    likesCount: number
    repliesCount?: number
  }
  createdAt: string
  updatedAt: string
  slug: string
  score?: number
}

// Search highlight interface
interface SearchHighlight {
  field: 'title' | 'content' | 'excerpt'
  fragments: string[]
}

// Facet interfaces
interface FacetItem {
  value: string
  count: number
  label: string
}

interface SearchFacets {
  modules: FacetItem[]
  categories: FacetItem[]
  authors: FacetItem[]
  tags: FacetItem[]
  dateRanges: FacetItem[]
}

// ============================================================================
// SEARCH VALIDATION SCHEMAS
// ============================================================================

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required').max(500, 'Query too long'),
  filters: z.object({
    modules: z.array(z.enum(['forum', 'blog', 'wiki'])).optional(),
    authors: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.array(z.enum(['beginner', 'intermediate', 'advanced'])).optional(),
    status: z.array(z.enum(['published', 'draft', 'archived'])).optional()
  }).optional(),
  sort: z.enum(['relevance', 'date-desc', 'date-asc', 'views-desc', 'likes-desc', 'title-asc', 'author-asc']).default('relevance'),
  date_range: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  }).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  highlight: z.boolean().default(true),
  facets: z.boolean().default(true)
})

type SearchQueryData = z.infer<typeof searchQuerySchema>

// ============================================================================
// ENTERPRISE SEARCH API
// ============================================================================

export const POST = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: { 
    user?: ServerUser; 
    validatedData: SearchQueryData; 
    dal: typeof DAL 
  }) => {
    const startTime = performance.now()
    
    try {
      const { 
        q: query, 
        filters = {}, 
        sort, 
        date_range, 
        limit, 
        offset, 
        highlight,
        facets 
      } = validatedData

      // Initialize search results array
      let allResults: SearchResultItem[] = []
      const searchModules = filters.modules || ['forum', 'blog', 'wiki']

      // Search across specified modules
      for (const searchModule of searchModules) {
        try {
          let moduleResults: SearchResultItem[] = []

          switch (searchModule) {
            case 'forum':
              const forumResults = await dal.forum.searchPosts({
                query,
                categories: filters.categories,
                tags: filters.tags,
                authors: filters.authors,
                status: filters.status?.includes('published') ? 'active' : 'all',
                dateRange: date_range ? {
                  from: date_range.from ? new Date(date_range.from) : undefined,
                  to: date_range.to ? new Date(date_range.to) : undefined
                } : undefined,
                sortBy: mapSortOption(sort),
                limit: Math.ceil(limit / searchModules.length),
                offset: Math.floor(offset / searchModules.length)
              })
              
              moduleResults = forumResults.map(post => ({
                id: post.id,
                module: 'forum',
                type: 'post',
                title: post.title,
                excerpt: post.excerpt || generateExcerpt(post.content),
                content: post.content,
                author: post.author,
                category: post.categoryName,
                tags: post.tags || [],
                stats: post.stats,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                slug: post.slug,
                score: calculateRelevanceScore(post, query),
                highlights: highlight ? generateHighlights(post, query) : undefined
              }))
              break

            case 'blog':
              const blogResults = await dal.blog.searchPosts({
                query,
                categories: filters.categories,
                tags: filters.tags,
                authors: filters.authors,
                status: filters.status?.[0] || 'published',
                dateRange: date_range ? {
                  from: date_range.from ? new Date(date_range.from) : undefined,
                  to: date_range.to ? new Date(date_range.to) : undefined
                } : undefined,
                sortBy: mapSortOption(sort),
                limit: Math.ceil(limit / searchModules.length),
                offset: Math.floor(offset / searchModules.length)
              })

              moduleResults = blogResults.map(post => ({
                id: post.id,
                module: 'blog',
                type: 'post',
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
                author: post.author,
                category: post.category,
                tags: post.tags || [],
                stats: post.stats,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                slug: post.slug,
                score: calculateRelevanceScore(post, query),
                highlights: highlight ? generateHighlights(post, query) : undefined
              }))
              break

            case 'wiki':
              const wikiResults = await dal.wiki.searchGuides({
                query,
                categories: filters.categories,
                difficulty: filters.difficulty?.[0],
                tags: filters.tags,
                authors: filters.authors,
                status: filters.status?.[0] || 'published',
                dateRange: date_range ? {
                  from: date_range.from ? new Date(date_range.from) : undefined,
                  to: date_range.to ? new Date(date_range.to) : undefined
                } : undefined,
                sortBy: mapSortOption(sort),
                limit: Math.ceil(limit / searchModules.length),
                offset: Math.floor(offset / searchModules.length)
              })

              moduleResults = wikiResults.map(guide => ({
                id: guide.id,
                module: 'wiki',
                type: 'guide',
                title: guide.title,
                excerpt: guide.excerpt,
                content: guide.content,
                author: guide.author,
                category: guide.category,
                tags: guide.tags || [],
                stats: guide.stats,
                createdAt: guide.createdAt,
                updatedAt: guide.updatedAt,
                slug: guide.slug,
                score: calculateRelevanceScore(guide, query),
                highlights: highlight ? generateHighlights(guide, query) : undefined,
                difficulty: guide.difficulty
              }))
              break
          }

          allResults.push(...moduleResults)
        } catch (moduleError) {
          console.error(`Search error in ${module}:`, moduleError)
          // Continue with other modules even if one fails
        }
      }

      // Sort all results by relevance score and sort option
      allResults = sortSearchResults(allResults, sort)

      // Apply final pagination
      const totalCount = allResults.length
      const paginatedResults = allResults.slice(offset, offset + limit)

      // Generate facets if requested
      const searchFacets = facets ? generateFacets(allResults) : undefined

      const searchTime = performance.now() - startTime

      return ApiResponse.success({
        results: paginatedResults,
        totalCount,
        searchTime: Math.round(searchTime),
        facets: searchFacets,
        query: {
          q: query,
          filters,
          sort,
          date_range,
          limit,
          offset
        }
      })

    } catch (error) {
      console.error('Search API error:', error)
      const searchTime = performance.now() - startTime
      
      return ApiResponse.error('Search failed', 500, {
        searchTime: Math.round(searchTime),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },
  {
    schema: searchQuerySchema,
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapSortOption(sort: string): 'latest' | 'popular' | 'views' {
  switch (sort) {
    case 'date-desc': return 'latest'
    case 'views-desc': return 'views'
    case 'likes-desc': return 'popular'
    default: return 'latest'
  }
}

function calculateRelevanceScore(item: SearchableContent, query: string): number {
  const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
  let score = 0

  // Title matches (highest weight)
  const titleLower = item.title.toLowerCase()
  queryTerms.forEach(term => {
    if (titleLower.includes(term)) {
      score += titleLower === term ? 100 : titleLower.startsWith(term) ? 80 : 60
    }
  })

  // Excerpt matches (medium weight)
  if (item.excerpt) {
    const excerptLower = item.excerpt.toLowerCase()
    queryTerms.forEach(term => {
      if (excerptLower.includes(term)) score += 30
    })
  }

  // Content matches (lower weight)
  if (item.content) {
    const contentLower = item.content.toLowerCase()
    queryTerms.forEach(term => {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length
      score += matches * 10
    })
  }

  // Boost based on engagement
  if (item.stats) {
    score += Math.log10(item.stats.viewsCount + 1) * 5
    score += Math.log10(item.stats.likesCount + 1) * 10
    if (item.stats.repliesCount) {
      score += Math.log10(item.stats.repliesCount + 1) * 8
    }
  }

  // Boost recent content
  if (item.createdAt) {
    const daysSinceCreated = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated < 7) score += 20
    else if (daysSinceCreated < 30) score += 10
  }

  return Math.round(score)
}

function generateExcerpt(content: string, maxLength = 200): string {
  if (!content) return ''
  
  // Strip HTML tags
  const textContent = content.replace(/<[^>]*>/g, '').trim()
  
  if (textContent.length <= maxLength) return textContent
  
  // Find a good breaking point
  const truncated = textContent.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return lastSpace > maxLength * 0.8 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

function generateHighlights(item: SearchableContent, query: string): SearchHighlight[] {
  const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
  const highlights: SearchHighlight[] = []

  // Title highlights
  if (item.title) {
    const titleFragments = highlightText(item.title, queryTerms)
    if (titleFragments.some(f => f.includes('<mark>'))) {
      highlights.push({
        field: 'title' as const,
        fragments: [titleFragments.join('')]
      })
    }
  }

  // Content highlights
  if (item.content || item.excerpt) {
    const content = item.content || item.excerpt
    const contentFragments = extractHighlightFragments(content, queryTerms)
    if (contentFragments.length > 0) {
      highlights.push({
        field: 'content' as const,
        fragments: contentFragments
      })
    }
  }

  return highlights
}

function highlightText(text: string, terms: string[]): string[] {
  let highlighted = text
  
  terms.forEach(term => {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark>$1</mark>')
  })

  return [highlighted]
}

function extractHighlightFragments(content: string, terms: string[], maxFragments = 3, fragmentLength = 150): string[] {
  const fragments: string[] = []
  const contentLower = content.toLowerCase()
  
  terms.forEach(term => {
    const termIndex = contentLower.indexOf(term.toLowerCase())
    if (termIndex !== -1) {
      const startIndex = Math.max(0, termIndex - fragmentLength / 2)
      const endIndex = Math.min(content.length, startIndex + fragmentLength)
      
      let fragment = content.substring(startIndex, endIndex)
      
      // Highlight the term
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      fragment = fragment.replace(regex, '<mark>$1</mark>')
      
      if (startIndex > 0) fragment = '...' + fragment
      if (endIndex < content.length) fragment = fragment + '...'
      
      fragments.push(fragment)
    }
  })

  return fragments.slice(0, maxFragments)
}

function sortSearchResults(results: SearchResultItem[], sortOption: string): SearchResultItem[] {
  switch (sortOption) {
    case 'relevance':
      return results.sort((a, b) => (b.score || 0) - (a.score || 0))
    case 'date-desc':
      return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'date-asc':
      return results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case 'views-desc':
      return results.sort((a, b) => (b.stats?.viewsCount || 0) - (a.stats?.viewsCount || 0))
    case 'likes-desc':
      return results.sort((a, b) => (b.stats?.likesCount || 0) - (a.stats?.likesCount || 0))
    case 'title-asc':
      return results.sort((a, b) => a.title.localeCompare(b.title))
    case 'author-asc':
      return results.sort((a, b) => a.author.name.localeCompare(b.author.name))
    default:
      return results.sort((a, b) => (b.score || 0) - (a.score || 0))
  }
}

function generateFacets(results: SearchResultItem[]): SearchFacets {
  const facets = {
    modules: new Map<string, number>(),
    authors: new Map<string, number>(),
    categories: new Map<string, number>(),
    tags: new Map<string, number>(),
    dateRanges: new Map<string, number>()
  }

  results.forEach(result => {
    // Module facets
    facets.modules.set(result.module, (facets.modules.get(result.module) || 0) + 1)

    // Author facets
    if (result.author?.name) {
      facets.authors.set(result.author.name, (facets.authors.get(result.author.name) || 0) + 1)
    }

    // Category facets
    if (result.category) {
      facets.categories.set(result.category, (facets.categories.get(result.category) || 0) + 1)
    }

    // Tag facets
    result.tags?.forEach((tag: string) => {
      facets.tags.set(tag, (facets.tags.get(tag) || 0) + 1)
    })

    // Date range facets
    if (result.createdAt) {
      const date = new Date(result.createdAt)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      let range = '6+ months ago'
      if (daysDiff <= 7) range = 'Past week'
      else if (daysDiff <= 30) range = 'Past month'
      else if (daysDiff <= 90) range = 'Past 3 months'
      else if (daysDiff <= 180) range = 'Past 6 months'

      facets.dateRanges.set(range, (facets.dateRanges.get(range) || 0) + 1)
    }
  })

  // Convert maps to arrays and sort
  return {
    modules: Array.from(facets.modules.entries()).map(([value, count]) => ({
      value,
      count,
      label: value.charAt(0).toUpperCase() + value.slice(1)
    })).sort((a, b) => b.count - a.count),
    
    authors: Array.from(facets.authors.entries()).map(([value, count]) => ({
      value,
      count,
      label: value
    })).sort((a, b) => b.count - a.count).slice(0, 10),
    
    categories: Array.from(facets.categories.entries()).map(([value, count]) => ({
      value,
      count,
      label: value.charAt(0).toUpperCase() + value.slice(1)
    })).sort((a, b) => b.count - a.count),
    
    tags: Array.from(facets.tags.entries()).map(([value, count]) => ({
      value,
      count,
      label: value
    })).sort((a, b) => b.count - a.count).slice(0, 15),
    
    dateRanges: Array.from(facets.dateRanges.entries()).map(([value, count]) => ({
      value,
      count,
      label: value
    })).sort((a, b) => {
      const order = ['Past week', 'Past month', 'Past 3 months', 'Past 6 months', '6+ months ago']
      return order.indexOf(a.label) - order.indexOf(b.label)
    })
  }
}