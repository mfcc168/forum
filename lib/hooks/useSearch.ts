'use client';

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchEngine, type SearchQuery, type SearchResponse, type SearchFilters, type SearchSuggestion } from '@/lib/search/SearchEngine'
// useDebounce utility is defined at the bottom of this file

// ============================================================================
// SEARCH HOOK
// ============================================================================

export interface UseSearchOptions {
  initialQuery?: string
  initialFilters?: SearchFilters
  autoSearch?: boolean
  debounceMs?: number
  enabled?: boolean
}

interface SearchHistoryItem {
  query: string
  timestamp: string
  resultCount: number
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    initialQuery = '',
    initialFilters = {},
    autoSearch = true,
    debounceMs = 300,
    enabled = true
  } = options

  // Search state
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [sortBy, setSortBy] = useState<'relevance' | 'date-desc' | 'date-asc' | 'views-desc' | 'likes-desc'>('relevance')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  // Debounced values for API calls
  const debouncedQuery = useDebounce(query, debounceMs)
  const debouncedFilters = useDebounce(filters, debounceMs)

  const queryClient = useQueryClient()

  // Build search query object
  const searchQuery: SearchQuery = useMemo(() => ({
    query: debouncedQuery,
    filters: debouncedFilters,
    sortBy,
    dateRange: Object.keys(dateRange).length > 0 ? dateRange : undefined,
    limit: 20,
    offset: 0
  }), [debouncedQuery, debouncedFilters, sortBy, dateRange])

  // Main search query
  const searchResults = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchEngine.search(searchQuery),
    enabled: enabled && debouncedQuery.length >= 2 && autoSearch,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  // Manual search mutation
  const manualSearch = useMutation({
    mutationFn: (customQuery?: Partial<SearchQuery>) => {
      const finalQuery = { ...searchQuery, ...customQuery }
      return searchEngine.search(finalQuery)
    },
    onSuccess: (data) => {
      // Cache the results
      queryClient.setQueryData(['search', searchQuery], data)
    }
  })

  // Search function
  const executeSearch = useCallback((customQuery?: string, customFilters?: SearchFilters) => {
    const finalQuery = customQuery !== undefined ? customQuery : query
    const finalFilters = customFilters !== undefined ? customFilters : filters
    
    if (finalQuery.length < 2) return

    manualSearch.mutate({
      query: finalQuery,
      filters: finalFilters,
      sortBy,
      dateRange: Object.keys(dateRange).length > 0 ? dateRange : undefined
    })
  }, [query, filters, sortBy, dateRange, manualSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setFilters({})
    setDateRange({})
    queryClient.removeQueries({ queryKey: ['search'] })
  }, [queryClient])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Add/remove filter values
  const toggleFilter = useCallback((filterType: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType] as string[] || []
      const hasValue = currentValues.includes(value)
      
      return {
        ...prev,
        [filterType]: hasValue
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      }
    })
  }, [])

  // Get current data (from either automatic or manual search)
  const data = searchResults.data || manualSearch.data
  const isLoading = searchResults.isLoading || manualSearch.isPending
  const error = searchResults.error || manualSearch.error

  return {
    // Search state
    query,
    setQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    dateRange,
    setDateRange,

    // Search results
    data,
    results: data?.results || [],
    totalCount: data?.totalCount || 0,
    searchTime: data?.searchTime || 0,
    facets: data?.facets,
    suggestions: data?.suggestions || [],

    // Loading states
    isLoading,
    isSearching: isLoading,
    error,

    // Actions
    executeSearch,
    clearSearch,
    updateFilters,
    toggleFilter,

    // Utilities
    hasActiveFilters: Object.values(filters).some(values => Array.isArray(values) && values.length > 0),
    canSearch: query.length >= 2
  }
}

// ============================================================================
// SEARCH SUGGESTIONS HOOK
// ============================================================================

export interface UseSearchSuggestionsOptions {
  enabled?: boolean
  debounceMs?: number
  maxSuggestions?: number
  module?: 'blog' | 'forum' | 'wiki'
}

export function useSearchSuggestions(
  query: string, 
  options: UseSearchSuggestionsOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 200,
    maxSuggestions = 6,
    module
  } = options

  const debouncedQuery = useDebounce(query, debounceMs)

  const suggestionsQuery = useQuery({
    queryKey: ['search-suggestions', debouncedQuery, maxSuggestions, module],
    queryFn: () => searchEngine.getSuggestions(debouncedQuery, module),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
    retry: 1
  })

  return {
    suggestions: suggestionsQuery.data?.slice(0, maxSuggestions) || [],
    isLoading: suggestionsQuery.isLoading,
    error: suggestionsQuery.error
  }
}

// ============================================================================
// SEARCH ANALYTICS HOOK
// ============================================================================

export function useSearchAnalytics() {
  const queryClient = useQueryClient()

  // Track search result click
  const trackClick = useCallback((query: string, resultId: string, position: number) => {
    searchEngine.trackClick(query, resultId, position)
  }, [])

  // Track search with no results
  const trackNoResults = useCallback((query: string, filters?: SearchFilters) => {
    // This could be enhanced to track specific no-results patterns
  }, [])

  // Get search history from localStorage
  const getSearchHistory = useCallback((): SearchHistoryItem[] => {
    try {
      const stored = localStorage.getItem('search-history')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  // Save search to history
  const saveToHistory = useCallback((query: string, resultCount: number) => {
    try {
      const history = getSearchHistory()
      const newItem = {
        query,
        timestamp: new Date().toISOString(),
        resultCount
      }

      const updatedHistory = [
        newItem,
        ...history.filter((item: SearchHistoryItem) => item.query !== query)
      ].slice(0, 10)

      localStorage.setItem('search-history', JSON.stringify(updatedHistory))
      
      // Invalidate suggestions cache since history changed
      queryClient.invalidateQueries({ queryKey: ['search-suggestions'] })
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }, [getSearchHistory, queryClient])

  // Clear search history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem('search-history')
      queryClient.invalidateQueries({ queryKey: ['search-suggestions'] })
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  }, [queryClient])

  return {
    trackClick,
    trackNoResults,
    getSearchHistory,
    saveToHistory,
    clearHistory
  }
}

// ============================================================================
// SEARCH KEYBOARD SHORTCUTS HOOK
// ============================================================================

export interface UseSearchShortcutsOptions {
  onFocus?: () => void
  onEscape?: () => void
  onEnter?: () => void
  enabled?: boolean
}

export function useSearchShortcuts(options: UseSearchShortcutsOptions = {}) {
  const {
    onFocus,
    onEscape,
    onEnter,
    enabled = true
  } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        onFocus?.()
      }
      
      // Escape key
      if (event.key === 'Escape') {
        onEscape?.()
      }
      
      // Enter key (when search is focused)
      if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
        if (event.target.matches('[role="searchbox"]')) {
          onEnter?.()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onFocus, onEscape, onEnter, enabled])

  return {
    searchShortcut: navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'
  }
}

// ============================================================================
// SEARCH PERFORMANCE HOOK
// ============================================================================

export function useSearchPerformance() {
  const [metrics, setMetrics] = useState<{
    averageSearchTime: number
    totalSearches: number
    cacheHitRate: number
  }>({
    averageSearchTime: 0,
    totalSearches: 0,
    cacheHitRate: 0
  })

  const trackSearchPerformance = useCallback((searchTime: number, fromCache: boolean) => {
    setMetrics(prev => {
      const totalSearches = prev.totalSearches + 1
      const totalTime = prev.averageSearchTime * prev.totalSearches + searchTime
      const averageSearchTime = totalTime / totalSearches
      
      const cacheHits = prev.cacheHitRate * prev.totalSearches + (fromCache ? 1 : 0)
      const cacheHitRate = cacheHits / totalSearches

      return {
        averageSearchTime: Math.round(averageSearchTime),
        totalSearches,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100
      }
    })
  }, [])

  return {
    metrics,
    trackSearchPerformance
  }
}

// ============================================================================
// DEBOUNCE UTILITY HOOK
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}