'use client'

import { useMemo, useCallback } from 'react'
import { SearchErrorBoundary } from './SearchErrorBoundary'
import type { BlogPost, ForumPost, WikiGuide, DexMonster } from '@/lib/types'

type SearchableContent = BlogPost | ForumPost | WikiGuide | DexMonster

interface ClientSearchFilterProps<T extends SearchableContent> {
  /** Array of content items to filter */
  data: T[]
  /** Search query string */
  searchQuery: string
  /** Additional filters to apply (category, etc.) */
  filters?: {
    category?: string
    [key: string]: string | number | boolean | undefined
  }
  /** Fields to search within each item */
  searchFields?: (keyof T)[]
  /** Field name that contains the category */
  categoryField?: keyof T
  /** Render prop function that receives filtered data */
  children: (filteredData: T[]) => React.ReactNode
}

/**
 * High-performance client-side search and filter component.
 * 
 * Provides instant filtering without API calls for optimal UX.
 * Based on Dex's smooth search pattern, now standardized across all modules.
 * 
 * @example
 * ```tsx
 * <ClientSearchFilter
 *   data={posts}
 *   searchQuery={searchQuery}
 *   filters={{ category: selectedCategory }}
 *   searchFields={['title', 'content', 'excerpt']}
 *   categoryField="category"
 * >
 *   {(filteredPosts) => <PostList posts={filteredPosts} />}
 * </ClientSearchFilter>
 * ```
 */
export function ClientSearchFilter<T extends SearchableContent>({
  data,
  searchQuery,
  filters = {},
  searchFields = ['title', 'content', 'description', 'excerpt'] as (keyof T)[],
  categoryField = 'category' as keyof T,
  children
}: ClientSearchFilterProps<T>) {
  
  // Memoize search query processing for better performance
  const normalizedQuery = useMemo(() => 
    searchQuery?.trim().toLowerCase() || '', 
    [searchQuery]
  )

  // Memoize filter functions for performance
  const applyFilters = useCallback((items: T[]) => {
    if (!filters || Object.keys(filters).length === 0) return items

    return items.filter(item => {
      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        const itemCategory = item[categoryField]
        // Handle different category field structures across modules
        if (typeof itemCategory === 'string') {
          if (itemCategory !== filters.category) return false
        } else if ('categoryName' in item) {
          // For forum posts that might have categoryName
          if ((item as ForumPost).categoryName !== filters.category) return false
        } else {
          return false
        }
      }

      // Apply additional filters
      for (const [key, value] of Object.entries(filters)) {
        if (key !== 'category' && value && value !== 'all') {
          const itemValue = item[key as keyof T]
          if (itemValue !== value) return false
        }
      }

      return true
    })
  }, [filters, categoryField])

  // Memoize search function for performance
  const applySearch = useCallback((items: T[]) => {
    if (!normalizedQuery) return items

    return items.filter(item => {
      try {
        // Search in specified fields
        for (const field of searchFields) {
          const fieldValue = item[field]
          if (fieldValue && typeof fieldValue === 'string') {
            if (fieldValue.toLowerCase().includes(normalizedQuery)) {
              return true
            }
          }
        }

        // Search in arrays (tags, behaviors, etc.)
        if ('tags' in item && Array.isArray(item.tags)) {
          if (item.tags.some(tag => 
            typeof tag === 'string' && tag.toLowerCase().includes(normalizedQuery)
          )) {
            return true
          }
        }

        if ('behaviors' in item && Array.isArray((item as DexMonster).behaviors)) {
          if ((item as DexMonster).behaviors.some((behavior: string) => 
            typeof behavior === 'string' && behavior.toLowerCase().includes(normalizedQuery)
          )) {
            return true
          }
        }

        return false
      } catch (error) {
        // Gracefully handle any search errors
        console.warn('Search error for item:', item, error)
        return false
      }
    })
  }, [normalizedQuery, searchFields])

  // Apply filters and search with proper error handling
  const filteredData = useMemo(() => {
    try {
      if (!Array.isArray(data)) {
        console.warn('ClientSearchFilter: data prop is not an array')
        return []
      }

      let filtered = [...data]
      filtered = applyFilters(filtered)
      filtered = applySearch(filtered)
      return filtered
    } catch (error) {
      console.error('ClientSearchFilter: Error during filtering', error)
      return data || []
    }
  }, [data, applyFilters, applySearch])

  return <>{children(filteredData)}</>
}

/**
 * Production-ready wrapper that includes error boundary protection.
 * Use this in production environments for better error handling.
 * 
 * @example
 * ```tsx
 * <SafeClientSearchFilter
 *   data={posts}
 *   searchQuery={searchQuery}
 *   filters={{ category: selectedCategory }}
 * >
 *   {(filteredPosts) => <PostList posts={filteredPosts} />}
 * </SafeClientSearchFilter>
 * ```
 */
export function SafeClientSearchFilter<T extends SearchableContent>(props: ClientSearchFilterProps<T>) {
  return (
    <SearchErrorBoundary
      fallback={
        <div className="text-center py-8">
          <p className="text-slate-600">Search is temporarily unavailable. Showing all items.</p>
          {props.children(props.data || [])}
        </div>
      }
    >
      <ClientSearchFilter {...props} />
    </SearchErrorBoundary>
  )
}

/**
 * Hook version for components that need the filtered data directly.
 * 
 * @param data - Array of content items to filter
 * @param searchQuery - Search query string
 * @param filters - Additional filters to apply
 * @param options - Configuration options
 * @returns Filtered array of content items
 * 
 * @example
 * ```tsx
 * const filteredPosts = useClientSearchFilter(posts, searchQuery, { category: 'tech' })
 * ```
 */
export function useClientSearchFilter<T extends SearchableContent>(
  data: T[],
  searchQuery: string,
  filters: Record<string, string | number | boolean | undefined> = {},
  options: {
    searchFields?: (keyof T)[]
    categoryField?: keyof T
  } = {}
) {
  const { 
    searchFields = ['title', 'content', 'description', 'excerpt'] as (keyof T)[], 
    categoryField = 'category' as keyof T 
  } = options

  // Use the component's logic for consistency
  return useMemo(() => {
    try {
      if (!Array.isArray(data)) {
        console.warn('useClientSearchFilter: data is not an array')
        return []
      }

      const normalizedQuery = searchQuery?.trim().toLowerCase() || ''
      let filtered = [...data]

      // Apply filters
      if (filters && Object.keys(filters).length > 0) {
        filtered = filtered.filter(item => {
          // Apply category filter
          if (filters.category && filters.category !== 'all') {
            const itemCategory = item[categoryField]
            if (typeof itemCategory === 'string') {
              if (itemCategory !== filters.category) return false
            } else if ('categoryName' in item) {
              if ((item as ForumPost).categoryName !== filters.category) return false
            } else {
              return false
            }
          }

          // Apply additional filters
          for (const [key, value] of Object.entries(filters)) {
            if (key !== 'category' && value && value !== 'all') {
              const itemValue = item[key as keyof T]
              if (itemValue !== value) return false
            }
          }

          return true
        })
      }

      // Apply search
      if (normalizedQuery) {
        filtered = filtered.filter(item => {
          try {
            // Search in specified fields
            for (const field of searchFields) {
              const fieldValue = item[field]
              if (fieldValue && typeof fieldValue === 'string') {
                if (fieldValue.toLowerCase().includes(normalizedQuery)) {
                  return true
                }
              }
            }

            // Search in arrays (tags, behaviors, etc.)
            if ('tags' in item && Array.isArray(item.tags)) {
              if (item.tags.some(tag => 
                typeof tag === 'string' && tag.toLowerCase().includes(normalizedQuery)
              )) {
                return true
              }
            }

            if ('behaviors' in item && Array.isArray((item as DexMonster).behaviors)) {
              if ((item as DexMonster).behaviors.some((behavior: string) => 
                typeof behavior === 'string' && behavior.toLowerCase().includes(normalizedQuery)
              )) {
                return true
              }
            }

            return false
          } catch (error) {
            console.warn('Search error for item:', item, error)
            return false
          }
        })
      }

      return filtered
    } catch (error) {
      console.error('useClientSearchFilter: Error during filtering', error)
      return data || []
    }
  }, [data, searchQuery, filters, searchFields, categoryField])
}