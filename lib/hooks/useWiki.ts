/**
 * Wiki-Specific Hooks
 * 
 * Lightweight wrapper around generic content hooks with wiki-specific functionality.
 */

import { wikiHooks, type UseContentOptions, type UseInfiniteContentOptions } from './useContent'
import { useQuery } from '@tanstack/react-query'
import type { WikiCategory, WikiGuide, WikiStats } from '@/lib/types'

// ============================================================================
// WIKI-SPECIFIC OPTIONS
// ============================================================================

export interface UseWikiGuidesOptions extends UseContentOptions<'wiki'> {
  category?: 'getting-started' | 'gameplay' | 'features' | 'community'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime?: string
  sortBy?: 'latest' | 'popular' | 'trending' | 'helpful' | 'oldest'
}

// ============================================================================
// MAIN WIKI HOOKS (using generic system)
// ============================================================================

/**
 * Fetch wiki guides with filtering and pagination
 */
export function useWikiGuides(options: UseWikiGuidesOptions = {}) {
  return wikiHooks.useContent(options)
}

/**
 * Infinite scrolling wiki guides
 */
export function useInfiniteWikiGuides(options: Omit<UseWikiGuidesOptions, 'page'> = {}) {
  return wikiHooks.useInfiniteContent(options as UseInfiniteContentOptions<'wiki'>)
}

/**
 * Fetch single wiki guide by slug
 */
export function useWikiGuide(slug: string, options: { 
  enabled?: boolean; 
  initialData?: WikiGuide;
  refetchOnMount?: boolean;
  staleTime?: number;
} = {}) {
  return wikiHooks.useContentItem(slug, options)
}

/**
 * Create new wiki guide
 */
export function useCreateWikiGuide() {
  return wikiHooks.useCreateContent()
}

/**
 * Update existing wiki guide
 */
export function useUpdateWikiGuide() {
  return wikiHooks.useUpdateContent()
}

/**
 * Delete wiki guide
 */
export function useDeleteWikiGuide() {
  return wikiHooks.useDeleteContent()
}

/**
 * Wiki guide interactions (like, bookmark, share, helpful)
 */
export function useWikiGuideInteraction() {
  return wikiHooks.useContentInteraction()
}

// ============================================================================
// WIKI-SPECIFIC HOOKS
// ============================================================================

/**
 * Fetch wiki categories
 */
export function useWikiCategories() {
  return useQuery({
    queryKey: ['wiki-categories'],
    queryFn: async (): Promise<WikiCategory[]> => {
      const response = await fetch('/api/wiki/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch wiki categories')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch wiki categories')
      }
      
      return result.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Get wiki statistics
 */
export function useWikiStats(options: { initialData?: WikiStats } = {}) {
  return useQuery({
    queryKey: ['wiki-stats'],
    queryFn: async (): Promise<WikiStats> => {
      const response = await fetch('/api/stats/wiki')
      if (!response.ok) {
        throw new Error('Failed to fetch wiki statistics')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch wiki statistics')
      }
      
      return result.data
    },
    initialData: options.initialData,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}

/**
 * Search wiki guides
 */
export function useWikiSearch(query: string, options: Omit<UseWikiGuidesOptions, 'search'> = {}) {
  return useWikiGuides({
    ...options,
    search: query,
    enabled: !!query && query.length >= 1 // Allow single character searches like blog/forum
  })
}

/**
 * Get popular wiki guides
 */
export function usePopularWikiGuides(limit = 10) {
  return useQuery({
    queryKey: ['popular-wiki-guides', limit],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/guides?sortBy=popular&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error('Failed to fetch popular wiki guides')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch popular wiki guides')
      }
      
      return result.data?.wikiGuides || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Get recent wiki guides
 */
export function useRecentWikiGuides(limit = 10) {
  return useQuery({
    queryKey: ['recent-wiki-guides', limit],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/guides?sortBy=latest&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent wiki guides')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent wiki guides')
      }
      
      return result.data?.wikiGuides || []
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}

/**
 * Get guides by difficulty level
 */
export function useGuidesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced', limit = 20) {
  return useQuery({
    queryKey: ['wiki-guides-by-difficulty', difficulty, limit],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/guides?difficulty=${difficulty}&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${difficulty} wiki guides`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${difficulty} wiki guides`)
      }
      
      return result.data?.wikiGuides || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}