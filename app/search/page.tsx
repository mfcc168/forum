'use client';

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { SearchBar } from '@/app/components/ui/SearchBar'
import { SearchResults } from '@/app/components/ui/SearchResults'
import { useSearch, useSearchAnalytics, useSearchShortcuts } from '@/lib/hooks/useSearch'
import { Icon } from '@/app/components/ui/Icon'
import { Button } from '@/app/components/ui/Button'
import type { SearchResult, SearchFilters, SearchSortOption } from '@/lib/search/SearchEngine'

// ============================================================================
// SEARCH PAGE
// ============================================================================

export default function SearchPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [selectedFacets, setSelectedFacets] = useState<{ [key: string]: string[] }>({})
  
  // Initialize search from URL parameters
  const initialQuery = searchParams.get('q') || ''
  const initialModule = searchParams.get('type')
  const initialFilters: SearchFilters = {}
  
  if (initialModule && ['forum', 'blog', 'wiki'].includes(initialModule)) {
    initialFilters.modules = [initialModule as 'forum' | 'blog' | 'wiki']
  }

  // Search hook
  const {
    query,
    setQuery,
    filters,
    sortBy,
    setSortBy,
    executeSearch,
    clearSearch,
    toggleFilter,
    results,
    totalCount,
    searchTime,
    facets,
    isLoading,
    hasActiveFilters,
    canSearch
  } = useSearch({
    initialQuery,
    initialFilters,
    autoSearch: false // Manual search for better UX
  })

  // Search analytics
  const { trackClick, saveToHistory } = useSearchAnalytics()

  // Handle search execution
  const handleSearch = (searchQuery: string, searchFilters?: SearchFilters) => {
    if (searchQuery.length < 2) return
    
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('q', searchQuery)
    if (searchFilters?.modules?.[0]) {
      url.searchParams.set('type', searchFilters.modules[0])
    }
    window.history.pushState({}, '', url.toString())
    
    // Execute search
    executeSearch(searchQuery, searchFilters)
    
    // Save to history after results are loaded
    setTimeout(() => {
      saveToHistory(searchQuery, totalCount)
    }, 1000)
  }

  // Handle search with filters
  const handleAdvancedSearch = (params: {
    query: string
    filters: SearchFilters
    sortBy: SearchSortOption
    dateRange?: { from?: Date; to?: Date }
  }) => {
    handleSearch(params.query, params.filters)
    // Type guard to ensure only valid sort options are used
    const validSortOptions = ['relevance', 'date-desc', 'date-asc', 'views-desc', 'likes-desc'] as const
    if (validSortOptions.includes(params.sortBy as any)) {
      setSortBy(params.sortBy as any)
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult, position: number) => {
    trackClick(query, result.id, position)
  }

  // Handle facet changes
  const handleFacetChange = (facetType: string, value: string, selected: boolean) => {
    setSelectedFacets(prev => ({
      ...prev,
      [facetType]: selected 
        ? [...(prev[facetType] || []), value]
        : (prev[facetType] || []).filter(v => v !== value)
    }))
    
    toggleFilter(facetType as keyof SearchFilters, value)
  }

  // Keyboard shortcuts
  useSearchShortcuts({
    onFocus: () => {
      document.querySelector<HTMLInputElement>('[role="searchbox"]')?.focus()
    },
    onEscape: () => {
      document.querySelector<HTMLInputElement>('[role="searchbox"]')?.blur()
    }
  })

  // Auto-execute search if there's an initial query
  useEffect(() => {
    if (initialQuery && initialQuery.length >= 2) {
      executeSearch(initialQuery, initialFilters)
    }
  }, []) // Only run once on mount

  const hasResults = results.length > 0
  const hasQuery = query.length >= 2
  const showResults = hasQuery && !isLoading

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Search Everything
            </h1>
            <p className="text-emerald-100 text-lg mb-8">
              Find guides, discussions, and tutorials across our entire community
            </p>
            
            {/* Main Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={handleAdvancedSearch}
                placeholder="Search guides, posts, tutorials..."
                variant="hero"
                showAdvanced={true}
                modules={['forum', 'blog', 'wiki']}
                autoFocus={!initialQuery}
                className="mb-6"
              />
              
              {/* Quick Search Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: 'How to guides', query: 'how to', icon: 'book-open' },
                  { label: 'Tutorials', query: 'tutorial', icon: 'play' },
                  { label: 'Building tips', query: 'building', icon: 'hammer' },
                  { label: 'Server info', query: 'server', icon: 'server' }
                ].map(item => (
                  <button
                    key={item.query}
                    onClick={() => {
                      setQuery(item.query)
                      handleSearch(item.query)
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm"
                  >
                    <Icon name={item.icon} className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Search Actions Bar */}
        {hasQuery && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => handleSearch(query, filters)}
                disabled={!canSearch || isLoading}
                className="minecraft-button"
              >
                {isLoading ? (
                  <>
                    <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Icon name="search" className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                >
                  <Icon name="x" className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Sort Options */}
            {hasResults && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date-desc">Newest First</option>
                  <option value="views-desc">Most Viewed</option>
                  <option value="likes-desc">Most Liked</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {showResults ? (
          <SearchResults
            results={results}
            totalCount={totalCount}
            searchTime={searchTime}
            query={query}
            facets={facets}
            isLoading={isLoading}
            onResultClick={handleResultClick}
            onFacetChange={handleFacetChange}
            selectedFacets={selectedFacets}
          />
        ) : hasQuery ? (
          <SearchLoadingState />
        ) : (
          <SearchEmptyState onQuickSearch={(q) => {
            setQuery(q)
            handleSearch(q)
          }} />
        )}
      </div>

      {/* Search Tips */}
      <SearchTipsPanel />
    </div>
  )
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface SearchEmptyStateProps {
  onQuickSearch: (query: string) => void
}

function SearchEmptyState({ onQuickSearch }: SearchEmptyStateProps) {
  const { t } = useTranslation()

  const popularSearches = [
    'minecraft server setup',
    'redstone tutorials', 
    'building guides',
    'enchanting tips',
    'farming techniques',
    'pvp strategies'
  ]

  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <Icon name="search" className="w-24 h-24 text-slate-300 mx-auto mb-8" />
      
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Start Your Search
      </h2>
      <p className="text-slate-600 mb-8 max-w-xl mx-auto">
        Search through thousands of guides, discussions, and tutorials. 
        Use filters to find exactly what you need.
      </p>

      {/* Popular Searches */}
      <div className="mb-12">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Popular Searches</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {popularSearches.map(search => (
            <button
              key={search}
              onClick={() => onQuickSearch(search)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all text-sm"
            >
              {search}
            </button>
          ))}
        </div>
      </div>

      {/* Search Features */}
      <div className="grid md:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <Icon name="filter" className="w-8 h-8 text-emerald-500 mb-3" />
          <h3 className="font-semibold text-slate-800 mb-2">Advanced Filters</h3>
          <p className="text-sm text-slate-600">
            Filter by content type, author, date range, and more to find exactly what you need.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <Icon name="zap" className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-slate-800 mb-2">Smart Suggestions</h3>
          <p className="text-sm text-slate-600">
            Get intelligent search suggestions and autocomplete as you type.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <Icon name="trending-up" className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold text-slate-800 mb-2">Relevance Ranking</h3>
          <p className="text-sm text-slate-600">
            Results are intelligently ranked by relevance, popularity, and freshness.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

function SearchLoadingState() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Icon name="loader" className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Searching across all content...</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SEARCH TIPS PANEL COMPONENT
// ============================================================================

function SearchTipsPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-t border-slate-200 bg-white">
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-slate-800">Search Tips & Shortcuts</h3>
            <Icon 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              className="w-5 h-5 text-slate-400" 
            />
          </button>

          {isExpanded && (
            <div className="mt-6 grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Search Operators</h4>
                <ul className="space-y-1 text-slate-600">
                  <li><code className="bg-slate-100 px-1 rounded">author:username</code> - Find content by specific author</li>
                  <li><code className="bg-slate-100 px-1 rounded">category:builds</code> - Filter by category</li>
                  <li><code className="bg-slate-100 px-1 rounded">tag:redstone</code> - Filter by tags</li>
                  <li><code className="bg-slate-100 px-1 rounded">"exact phrase"</code> - Search for exact phrases</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Keyboard Shortcuts</h4>
                <ul className="space-y-1 text-slate-600">
                  <li><kbd className="bg-slate-100 px-1 rounded">Ctrl/⌘ + K</kbd> - Focus search bar</li>
                  <li><kbd className="bg-slate-100 px-1 rounded">↑/↓</kbd> - Navigate suggestions</li>
                  <li><kbd className="bg-slate-100 px-1 rounded">Enter</kbd> - Select suggestion</li>
                  <li><kbd className="bg-slate-100 px-1 rounded">Esc</kbd> - Close suggestions</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}