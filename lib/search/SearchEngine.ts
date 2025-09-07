/**
 * Enterprise Search Engine
 * 
 * Advanced search functionality with ranking, analytics, and performance optimization
 */

// ============================================================================
// SEARCH INTERFACES & TYPES
// ============================================================================

export interface SearchQuery {
  query: string
  filters?: SearchFilters
  sortBy?: SearchSortOption
  dateRange?: DateRange
  limit?: number
  offset?: number
}

export interface SearchFilters {
  modules?: ('forum' | 'blog' | 'wiki')[]
  authors?: string[]
  categories?: string[]
  tags?: string[]
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[]
  status?: ('published' | 'draft' | 'archived')[]
}

export interface DateRange {
  from?: Date
  to?: Date
}

export type SearchSortOption = 
  | 'relevance' 
  | 'date-desc' 
  | 'date-asc' 
  | 'views-desc' 
  | 'likes-desc' 
  | 'title-asc'
  | 'author-asc'

// Raw search result from API (before transformation)
export interface RawSearchResult {
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
  tags?: string[]
  stats: {
    viewsCount: number
    likesCount: number
    repliesCount?: number
  }
  createdAt: string
  updatedAt: string
  slug: string
  score?: number
  highlights?: SearchHighlight[]
}

// Transformed search result (for UI consumption)
export interface SearchResult {
  id: string
  module: 'forum' | 'blog' | 'wiki' | 'dex'
  type: 'post' | 'guide' | 'reply' | 'monster'
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
  url: string
  relevanceScore: number
  highlights?: SearchHighlight[]
}

export interface SearchHighlight {
  field: 'title' | 'content' | 'excerpt'
  fragments: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  searchTime: number
  suggestions?: string[]
  facets?: SearchFacets
  query: SearchQuery
}

export interface SearchFacets {
  modules: FacetItem[]
  authors: FacetItem[]
  categories: FacetItem[]
  tags: FacetItem[]
  dateRanges: FacetItem[]
}

export interface FacetItem {
  value: string
  count: number
  label: string
}

export interface SearchSuggestion {
  text: string
  type: 'completion' | 'correction' | 'recent' | 'popular'
  count?: number
}

export interface SearchAnalytics {
  query: string
  resultCount: number
  clickedResults: string[]
  searchTime: number
  userId?: string
  timestamp: Date
  sessionId: string
  filters?: SearchFilters
}

// ============================================================================
// SEARCH ENGINE CLASS
// ============================================================================

export class SearchEngine {
  private static instance: SearchEngine
  private analyticsBuffer: SearchAnalytics[] = []
  private popularQueries: Map<string, number> = new Map()
  private searchCache: Map<string, { results: SearchResponse; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine()
    }
    return SearchEngine.instance
  }

  /**
   * Main search method with enterprise features
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(query)

    // Check cache first
    const cached = this.searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results
    }

    try {
      // Build search request
      const searchParams = this.buildSearchParams(query)
      
      // Execute search
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      const searchTime = performance.now() - startTime

      const results: SearchResponse = {
        results: data.results.map((item: RawSearchResult) => this.transformResult(item)),
        totalCount: data.totalCount,
        searchTime,
        suggestions: await this.generateSuggestions(query.query),
        facets: data.facets,
        query
      }

      // Cache results
      this.searchCache.set(cacheKey, { results, timestamp: Date.now() })

      // Track analytics
      this.trackSearch({
        query: query.query,
        resultCount: results.totalCount,
        clickedResults: [],
        searchTime,
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        filters: query.filters
      })

      return results

    } catch (error) {
      console.error('Search error:', error)
      return {
        results: [],
        totalCount: 0,
        searchTime: performance.now() - startTime,
        query,
        suggestions: await this.generateSuggestions(query.query)
      }
    }
  }

  /**
   * Get search suggestions with autocomplete
   */
  async getSuggestions(partialQuery: string, module?: 'blog' | 'forum' | 'wiki'): Promise<SearchSuggestion[]> {
    if (partialQuery.length < 2) return []

    const suggestions: SearchSuggestion[] = []

    // Recent searches
    const recentSearches = this.getRecentSearches()
    recentSearches
      .filter(q => q.toLowerCase().includes(partialQuery.toLowerCase()))
      .slice(0, 3)
      .forEach(query => {
        suggestions.push({ text: query, type: 'recent' })
      })

    // Popular searches
    Array.from(this.popularQueries.entries())
      .filter(([query]) => query.toLowerCase().includes(partialQuery.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([query, count]) => {
        suggestions.push({ text: query, type: 'popular', count })
      })

    // Fetch suggestions from API
    try {
      const url = `/api/search/suggestions?q=${encodeURIComponent(partialQuery)}${module ? `&module=${module}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const apiResponse = await response.json()
        const apiData = apiResponse.success ? apiResponse.data : apiResponse
        
        // Add completions from API
        apiData.completions?.forEach((text: string) => {
          suggestions.push({ text, type: 'completion' })
        })
        
        // Add corrections from API
        apiData.corrections?.forEach((text: string) => {
          suggestions.push({ text, type: 'correction' })
        })
        
        // Add popular searches from API (avoiding duplicates from local popular queries)
        apiData.popular?.forEach((text: string) => {
          if (!suggestions.find(s => s.text === text)) {
            suggestions.push({ text, type: 'popular' })
          }
        })
      }
    } catch (error) {
      console.warn('Failed to fetch suggestions:', error)
    }

    // Add module-specific fallback suggestions if we have very few
    if (suggestions.length < 3) {
      const fallbackSuggestions = this.getModuleFallbackSuggestions(module)
      
      fallbackSuggestions
        .filter(text => text.toLowerCase().includes(partialQuery.toLowerCase()))
        .slice(0, 3)
        .forEach(text => {
          if (!suggestions.find(s => s.text === text)) {
            suggestions.push({ text, type: 'completion' })
          }
        })
    }

    // Remove duplicates and limit
    return suggestions
      .filter((suggestion, index, arr) => 
        arr.findIndex(s => s.text === suggestion.text) === index
      )
      .slice(0, 8)
  }

  /**
   * Advanced search with all filters
   */
  async advancedSearch(params: {
    query?: string
    modules?: string[]
    authors?: string[]
    categories?: string[]
    tags?: string[]
    dateRange?: DateRange
    sortBy?: SearchSortOption
    limit?: number
  }): Promise<SearchResponse> {
    const searchQuery: SearchQuery = {
      query: params.query || '',
      filters: {
        modules: params.modules as ('forum' | 'blog' | 'wiki')[],
        authors: params.authors,
        categories: params.categories,
        tags: params.tags
      },
      sortBy: params.sortBy || 'relevance',
      dateRange: params.dateRange,
      limit: params.limit || 20
    }

    return this.search(searchQuery)
  }

  /**
   * Search analytics and tracking
   */
  trackSearch(analytics: SearchAnalytics): void {
    this.analyticsBuffer.push(analytics)
    
    // Update popular queries
    const currentCount = this.popularQueries.get(analytics.query) || 0
    this.popularQueries.set(analytics.query, currentCount + 1)

    // Batch send analytics (every 10 searches or 30 seconds)
    if (this.analyticsBuffer.length >= 10) {
      this.flushAnalytics()
    }
  }

  /**
   * Track search result clicks
   */
  trackClick(query: string, resultId: string, position: number): void {
    // Send click tracking
    fetch('/api/search/analytics/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        resultId,
        position,
        timestamp: new Date(),
        sessionId: this.getSessionId()
      })
    }).catch(error => console.warn('Failed to track click:', error))
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private buildSearchParams(query: SearchQuery) {
    return {
      q: query.query,
      filters: query.filters,
      sort: query.sortBy || 'relevance',
      date_range: query.dateRange,
      limit: query.limit || 20,
      offset: query.offset || 0,
      highlight: true,
      facets: true
    }
  }

  private transformResult(item: RawSearchResult): SearchResult {
    return {
      id: item.id,
      module: item.module,
      type: item.type,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      author: item.author,
      category: item.category,
      tags: item.tags || [],
      stats: item.stats,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      slug: item.slug,
      url: this.buildResultUrl(item),
      relevanceScore: item.score || 0,
      highlights: item.highlights
    }
  }

  private buildResultUrl(item: RawSearchResult): string {
    const baseUrls: { [key: string]: string } = {
      forum: '/forum',
      blog: '/blog', 
      wiki: '/wiki'
    }
    return `${baseUrls[item.module] || '/'}/${item.slug}`
  }

  private generateCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      q: query.query,
      f: query.filters,
      s: query.sortBy,
      d: query.dateRange,
      l: query.limit,
      o: query.offset
    })
  }

  private async generateSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 3) return []

    // Simple suggestion generation - could be enhanced with ML
    const words = query.toLowerCase().split(' ')
    const suggestions = []

    // Common search variations
    if (words.includes('how')) {
      suggestions.push(`${query} tutorial`, `${query} guide`)
    }
    if (words.includes('best')) {
      suggestions.push(`${query} 2024`, `${query} tips`)
    }

    return suggestions.slice(0, 3)
  }

  private getRecentSearches(): string[] {
    try {
      const stored = localStorage.getItem('recent-searches')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private getModuleFallbackSuggestions(module?: 'blog' | 'forum' | 'wiki'): string[] {
    switch (module) {
      case 'blog':
        return [
          'minecraft news',
          'server updates', 
          'community events',
          'patch notes',
          'developer blog',
          'community highlights'
        ]
      case 'forum':
        return [
          'server discussion',
          'game help',
          'technical support',
          'community chat',
          'player reports',
          'suggestions'
        ]
      case 'wiki':
        return [
          'minecraft guide',
          'redstone tutorial', 
          'building guide',
          'enchanting guide',
          'farming tips',
          'gameplay mechanics'
        ]
      default:
        return [
          'minecraft server setup',
          'redstone tutorial', 
          'building guide',
          'enchanting guide',
          'farming tips',
          'multiplayer guide'
        ]
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('search-session-id')
    if (!sessionId) {
      sessionId = `search-${Date.now()}-${Math.random().toString(36).substring(7)}`
      sessionStorage.setItem('search-session-id', sessionId)
    }
    return sessionId
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsBuffer.length === 0) return

    try {
      await fetch('/api/search/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [...this.analyticsBuffer]
        })
      })
      this.analyticsBuffer = []
    } catch (error) {
      console.warn('Failed to send search analytics:', error)
    }
  }
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

export class SearchUtils {
  /**
   * Highlight search terms in text
   */
  static highlightText(text: string, searchTerms: string[]): string {
    if (!searchTerms.length) return text

    const regex = new RegExp(`(${searchTerms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|')})`, 'gi')

    return text.replace(regex, '<mark class="search-highlight">$1</mark>')
  }

  /**
   * Create search excerpt with highlights
   */
  static createExcerpt(content: string, searchTerms: string[], maxLength = 200): string {
    if (!searchTerms.length) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }

    // Find first occurrence of search term
    const lowerContent = content.toLowerCase()
    let startIndex = 0

    for (const term of searchTerms) {
      const index = lowerContent.indexOf(term.toLowerCase())
      if (index !== -1) {
        startIndex = Math.max(0, index - 50)
        break
      }
    }

    const excerpt = content.substring(startIndex, startIndex + maxLength)
    const highlighted = this.highlightText(excerpt, searchTerms)
    
    return (startIndex > 0 ? '...' : '') + highlighted + (startIndex + maxLength < content.length ? '...' : '')
  }

  /**
   * Parse search query for advanced features
   */
  static parseQuery(query: string): { cleanQuery: string; filters: Partial<SearchFilters> } {
    const filters: Partial<SearchFilters> = {}
    let cleanQuery = query

    // Parse author: filter
    const authorMatch = query.match(/author:(\w+)/g)
    if (authorMatch) {
      filters.authors = authorMatch.map(match => match.replace('author:', ''))
      cleanQuery = cleanQuery.replace(/author:\w+/g, '').trim()
    }

    // Parse category: filter  
    const categoryMatch = query.match(/category:(\w+)/g)
    if (categoryMatch) {
      filters.categories = categoryMatch.map(match => match.replace('category:', ''))
      cleanQuery = cleanQuery.replace(/category:\w+/g, '').trim()
    }

    // Parse tag: filter
    const tagMatch = query.match(/tag:(\w+)/g)
    if (tagMatch) {
      filters.tags = tagMatch.map(match => match.replace('tag:', ''))
      cleanQuery = cleanQuery.replace(/tag:\w+/g, '').trim()
    }

    return { cleanQuery, filters }
  }
}

// Singleton instance
export const searchEngine = SearchEngine.getInstance()