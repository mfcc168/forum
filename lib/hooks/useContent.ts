/**
 * Generic Content Hooks
 * 
 * Unified hooks system that eliminates 440+ lines of duplication across
 * useForum.ts, useBlog.ts, and useWiki.ts by providing generic CRUD operations
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import type { 
  ForumPost, 
  BlogPost, 
  WikiGuide,
  DexMonster,
  ContentFilters,
  PaginationMeta,
  DetailedInteractionResponse,
  ContentStats,
  ContentInteractionState
} from '@/lib/types'

// ============================================================================
// TYPES FOR GENERIC CONTENT OPERATIONS
// ============================================================================

/** Supported content types */
export type ContentType = 'forum' | 'blog' | 'wiki' | 'dex'

/** Generic content item union */
export type ContentItem = ForumPost | BlogPost | WikiGuide | DexMonster

/** Content type mapping */
type ContentTypeMap = {
  forum: ForumPost
  blog: BlogPost
  wiki: WikiGuide
  dex: DexMonster
}

/** Content API endpoints mapping */
const ENDPOINTS = {
  forum: '/api/forum/posts',
  blog: '/api/blog/posts', 
  wiki: '/api/wiki/guides',
  dex: '/api/dex/monsters'
} as const

/** Content names for UI messages */
const CONTENT_NAMES = {
  forum: 'post',
  blog: 'blog post',
  wiki: 'guide',
  dex: 'monster'
} as const

// ============================================================================
// GENERIC QUERY OPTIONS
// ============================================================================

export interface UseContentOptions<T extends ContentType = ContentType> extends ContentFilters {
  enabled?: boolean
  initialData?: ContentTypeMap[T][]
  staleTime?: number
  gcTime?: number
}

export interface UseInfiniteContentOptions<T extends ContentType = ContentType> extends Omit<UseContentOptions<T>, 'page'> {
  pageSize?: number
}

// ============================================================================
// GENERIC CONTENT HOOKS
// ============================================================================

/**
 * Generic hook for fetching content lists with filtering and pagination
 */
export function useContent<T extends ContentType>(
  type: T, 
  options: UseContentOptions<T> = {}
): {
  data: ContentTypeMap[T][] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { enabled = true, initialData, staleTime = 5 * 60 * 1000, ...filters } = options
  const { data: session } = useSession()
  
  const query = useQuery({
    queryKey: [`${type}-content`, filters, session?.user?.id || 'anonymous'],
    queryFn: async (): Promise<ContentTypeMap[T][]> => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            // Handle arrays (like tags) by joining with commas
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })
      
      const response = await fetch(`${ENDPOINTS[type]}?${params}`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch ${CONTENT_NAMES[type]}s`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${CONTENT_NAMES[type]}s`)
      }
      
      // Extract data based on content type to avoid false fallbacks with empty arrays
      if (result.data?.blogPosts !== undefined) {
        return result.data.blogPosts
      }
      if (result.data?.forumPosts !== undefined) {
        return result.data.forumPosts
      }
      if (result.data?.wikiGuides !== undefined) {
        return result.data.wikiGuides
      }
      if (result.data?.dexMonsters !== undefined) {
        return result.data.dexMonsters
      }
      return result.data || []
    },
    enabled,
    initialData,
    staleTime,
    gcTime: staleTime * 2
  })

  return {
    data: query.data as ContentTypeMap[T][] | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

/**
 * Generic hook for infinite scrolling content
 */
export function useInfiniteContent<T extends ContentType>(
  type: T,
  options: UseInfiniteContentOptions<T> = {}
) {
  const { pageSize = 20, ...filters } = options
  
  return useInfiniteQuery({
    queryKey: [`${type}-content-infinite`, filters],
    queryFn: async ({ pageParam = 1 }): Promise<{
      items: ContentTypeMap[T][]
      pagination: PaginationMeta
    }> => {
      const params = new URLSearchParams()
      Object.entries({
        ...filters,
        page: String(pageParam),
        limit: String(pageSize)
      }).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            // Handle arrays (like tags) by joining with commas
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })
      
      const response = await fetch(`${ENDPOINTS[type]}?${params}`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch ${CONTENT_NAMES[type]}s`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${CONTENT_NAMES[type]}s`)
      }
      
      return {
        items: result.data?.blogPosts || result.data?.forumPosts || result.data?.wikiGuides || result.data?.dexMonsters || result.data || [],
        pagination: result.data?.pagination || { 
          page: pageParam, 
          pages: 1, 
          total: 0, 
          limit: pageSize,
          hasNext: false,
          hasPrev: false 
        }
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
    },
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Generic hook for fetching a single content item by slug
 */
export function useContentItem<T extends ContentType>(
  type: T,
  slug: string,
  options: { 
    enabled?: boolean; 
    initialData?: ContentTypeMap[T];
    refetchOnMount?: boolean;
    staleTime?: number;
  } = {}
) {
  const { enabled = true, initialData, refetchOnMount = false, staleTime = 5 * 60 * 1000 } = options
  const { data: session } = useSession()
  
  return useQuery({
    queryKey: [`${type}-content`, slug, session?.user?.id || 'anonymous'],
    queryFn: async (): Promise<ContentTypeMap[T]> => {
      const response = await fetch(`${ENDPOINTS[type]}/${slug}`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`${CONTENT_NAMES[type]} not found`)
        }
        throw new Error(`Failed to fetch ${CONTENT_NAMES[type]}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${CONTENT_NAMES[type]}`)
      }
      
      const contentData = result.data?.blogPost || result.data?.forumPost || result.data?.wikiGuide || result.data?.dexMonster || result.data
      
      // Extract the actual content item from the API response structure
      return contentData
    },
    enabled: enabled && !!slug,
    initialData,
    refetchOnMount,
    staleTime
  })
}

// ============================================================================
// GENERIC MUTATION HOOKS
// ============================================================================

/**
 * Generic hook for creating content
 */
export function useCreateContent<T extends ContentType>(type: T) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async (data: Partial<ContentTypeMap[T]>): Promise<ContentTypeMap[T]> => {
      const response = await fetch(ENDPOINTS[type], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create ${CONTENT_NAMES[type]}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to create ${CONTENT_NAMES[type]}`)
      }
      
      // Extract the created item from the nested response
      // API responses are { blogPost: post }, { wikiGuide: guide }, { forumPost: post }, { dexMonster: monster }
      const responseData = result.data as Record<string, unknown>
      if (type === 'blog' && 'blogPost' in responseData) {
        return responseData.blogPost as ContentTypeMap[T]
      } else if (type === 'wiki' && 'wikiGuide' in responseData) {
        return responseData.wikiGuide as ContentTypeMap[T]
      } else if (type === 'forum' && 'forumPost' in responseData) {
        return responseData.forumPost as ContentTypeMap[T]
      } else if (type === 'dex' && 'dexMonster' in responseData) {
        return responseData.dexMonster as ContentTypeMap[T]
      }
      
      // Fallback for unexpected response structure
      return responseData as unknown as ContentTypeMap[T]
    },
    onSuccess: (data) => {
      // Pre-warm the cache for the created item's detail page
      // This allows immediate redirect to detail page without additional API call
      const slug = data.slug || data.id
      if (slug) {
        queryClient.setQueryData(
          [`${type}-content`, slug, session?.user?.id || 'anonymous'],
          data
        )
      }
      
      // Invalidate related queries with broader scope
      queryClient.invalidateQueries({ queryKey: [`${type}-content`] })
      queryClient.invalidateQueries({ queryKey: [`${type}-stats`] })
      queryClient.invalidateQueries({ queryKey: [`${type}-categories`] })
      
      // Also invalidate any popular/recent queries
      queryClient.invalidateQueries({ queryKey: [`popular-${type}-posts`] })
      queryClient.invalidateQueries({ queryKey: [`recent-${type}-posts`] })
      queryClient.invalidateQueries({ queryKey: [`popular-${type}-guides`] })
      queryClient.invalidateQueries({ queryKey: [`recent-${type}-guides`] })
      
      toast.success(`${CONTENT_NAMES[type]} created successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

/**
 * Generic hook for updating content
 */
export function useUpdateContent<T extends ContentType>(type: T) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      slug, 
      data 
    }: { 
      slug: string
      data: Partial<ContentTypeMap[T]> 
    }): Promise<ContentTypeMap[T]> => {
      const response = await fetch(`${ENDPOINTS[type]}/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        let errorMessage = `Failed to update ${CONTENT_NAMES[type]}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          // If response is not JSON, use status text or generic message
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        throw new Error(`Server returned invalid response for ${CONTENT_NAMES[type]} update`)
      }
      
      if (!result.success) {
        throw new Error(result.error || `Failed to update ${CONTENT_NAMES[type]}`)
      }
      
      // Extract the updated item from the nested response and preserve slug information
      // API responses are { blogPost: post, slugChanged: boolean, newSlug?: string }
      const responseData = result.data as Record<string, unknown>
      let updatedItem: ContentTypeMap[T]
      
      if (type === 'blog' && 'blogPost' in responseData) {
        updatedItem = responseData.blogPost as ContentTypeMap[T]
      } else if (type === 'wiki' && 'wikiGuide' in responseData) {
        updatedItem = responseData.wikiGuide as ContentTypeMap[T]
      } else if (type === 'forum' && 'forumPost' in responseData) {
        updatedItem = responseData.forumPost as ContentTypeMap[T]
      } else if (type === 'dex' && 'dexMonster' in responseData) {
        updatedItem = responseData.dexMonster as ContentTypeMap[T]
      } else {
        // Fallback for unexpected response structure
        updatedItem = responseData as unknown as ContentTypeMap[T]
      }
      
      // Preserve slug information for URL redirection
      if ('newSlug' in responseData && responseData.newSlug) {
        (updatedItem as unknown as Record<string, unknown>).slug = responseData.newSlug
      }
      
      return updatedItem
    },
    onSuccess: (data, { slug }) => {
      // Update specific item cache
      queryClient.setQueryData([`${type}-content`, slug], data)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [`${type}-content`] })
      
      toast.success(`${CONTENT_NAMES[type]} updated successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

/**
 * Generic hook for deleting content
 */
export function useDeleteContent<T extends ContentType>(type: T) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (slug: string): Promise<void> => {
      const response = await fetch(`${ENDPOINTS[type]}/${slug}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete ${CONTENT_NAMES[type]}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to delete ${CONTENT_NAMES[type]}`)
      }
    },
    onSuccess: (_, slug) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: [`${type}-content`, slug] })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: [`${type}-content`] })
      queryClient.invalidateQueries({ queryKey: [`${type}-stats`] })
      
      toast.success(`${CONTENT_NAMES[type]} deleted successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

/**
 * Simplified hook for content interactions (like, bookmark, share)
 * Uses server-authoritative approach for better consistency
 */
export function useContentInteraction<T extends ContentType>(type: T) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async ({
      slug,
      action
    }: {
      slug: string
      action: 'like' | 'bookmark' | 'share' | 'helpful'
    }): Promise<DetailedInteractionResponse> => {
      const response = await fetch(`/api/interactions/${type}/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} ${CONTENT_NAMES[type]}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || `Failed to ${action} ${CONTENT_NAMES[type]}`)
      }
      
      return result.data
    },
    // Optimistic updates for immediate UI feedback
    onMutate: async ({ slug, action }) => {
      const userId = session?.user?.id || 'anonymous'
      const queryKey = [`${type}-content`, slug, userId]
      
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value for rollback  
      const previousData = queryClient.getQueryData<ContentTypeMap[T]>(queryKey)
      
      // Optimistically update to the new value  
      if (previousData) {
        queryClient.setQueryData<ContentTypeMap[T]>(queryKey, (old) => {
          if (!old) return old
          
          const currentStats = old.stats || {
            viewsCount: 0,
            likesCount: 0,
            bookmarksCount: 0,
            sharesCount: 0,
            helpfulsCount: 0
          }
          
          const currentInteractions = old.interactions || {
            isLiked: false,
            isBookmarked: false,
            isShared: false,
            isHelpful: false
          }
          
          // Calculate optimistic changes based on current state
          const newStats = { ...currentStats }
          const newInteractions = { ...currentInteractions }
          
          switch (action) {
            case 'like':
              const wasLiked = currentInteractions.isLiked
              newInteractions.isLiked = !wasLiked
              newStats.likesCount = Math.max(0, currentStats.likesCount + (wasLiked ? -1 : 1))
              break
            case 'bookmark':
              const wasBookmarked = currentInteractions.isBookmarked
              newInteractions.isBookmarked = !wasBookmarked
              newStats.bookmarksCount = Math.max(0, currentStats.bookmarksCount + (wasBookmarked ? -1 : 1))
              break
            case 'share':
              // Share doesn't toggle, just increments
              newStats.sharesCount = currentStats.sharesCount + 1
              break
            case 'helpful':
              const wasHelpful = currentInteractions.isHelpful
              newInteractions.isHelpful = !wasHelpful
              newStats.helpfulsCount = Math.max(0, (currentStats.helpfulsCount || 0) + (wasHelpful ? -1 : 1))
              break
          }
          
          return {
            ...old,
            stats: newStats,
            interactions: newInteractions
          }
        })
      }
      
      // Also optimistically update list caches for consistency across the app
      queryClient.setQueriesData(
        { queryKey: [`${type}-content`] },
        (oldQuery: unknown) => {
          if (!oldQuery || typeof oldQuery !== 'object') return oldQuery
          
          const old = oldQuery as Record<string, unknown>
          if (!old.data) return oldQuery
          
          // Handle different API response formats  
          let items: unknown[]
          if (Array.isArray(old.data)) {
            items = old.data
          } else if (typeof old.data === 'object' && old.data !== null) {
            const dataObj = old.data as Record<string, unknown>
            items = (dataObj.posts || dataObj.guides || dataObj.monsters || dataObj) as unknown[]
          } else {
            return oldQuery
          }
          
          if (!Array.isArray(items)) return oldQuery
          
          const updatedItems = items.map((item) => {
            if (typeof item === 'object' && item !== null && 
                'slug' in item && item.slug === slug) {
              const contentItem = item as ContentTypeMap[T]
              
              const currentStats = contentItem.stats || {
                viewsCount: 0,
                likesCount: 0, 
                bookmarksCount: 0,
                sharesCount: 0,
                helpfulsCount: 0
              }
              
              const currentInteractions = contentItem.interactions || {
                isLiked: false,
                isBookmarked: false,
                isShared: false,
                isHelpful: false
              }
              
              const newStats = { ...currentStats }
              const newInteractions = { ...currentInteractions }
              
              switch (action) {
                case 'like':
                  const wasLiked = currentInteractions.isLiked
                  newInteractions.isLiked = !wasLiked
                  newStats.likesCount = Math.max(0, currentStats.likesCount + (wasLiked ? -1 : 1))
                  break
                case 'bookmark':
                  const wasBookmarked = currentInteractions.isBookmarked
                  newInteractions.isBookmarked = !wasBookmarked
                  newStats.bookmarksCount = Math.max(0, currentStats.bookmarksCount + (wasBookmarked ? -1 : 1))
                  break
                case 'share':
                  newStats.sharesCount = currentStats.sharesCount + 1
                  break
                case 'helpful':
                  const wasHelpful = currentInteractions.isHelpful
                  newInteractions.isHelpful = !wasHelpful
                  newStats.helpfulsCount = Math.max(0, (currentStats.helpfulsCount || 0) + (wasHelpful ? -1 : 1))
                  break
              }
              
              return {
                ...contentItem,
                stats: newStats,
                interactions: newInteractions
              }
            }
            return item
          })
          
          // Preserve original response structure
          if (Array.isArray(old.data)) {
            return { ...old, data: updatedItems }
          } else {
            const dataObj = old.data as Record<string, unknown>
            const newData = { ...dataObj }
            if (dataObj.posts) newData.posts = updatedItems
            if (dataObj.guides) newData.guides = updatedItems
            if (dataObj.monsters) newData.monsters = updatedItems
            
            return {
              ...old,
              data: newData
            }
          }
        }
      )
      
      // Return context for rollback
      return { previousData, queryKey }
    },
    onError: (error, variables, context) => {
      // Roll back to the previous state if the mutation fails
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData)
      }
      
      // Also invalidate list caches to ensure consistency after rollback
      queryClient.invalidateQueries({ queryKey: [`${type}-content`] })
      
      // Show error feedback
      toast.error(`Failed to ${variables.action}. Please try again.`, { duration: 4000 })
    },
    onSuccess: (data, { slug, action }) => {
      // Simple cache replacement with authoritative server data
      // Use the same query key pattern that includes user ID
      const userId = session?.user?.id || 'anonymous'
      
      queryClient.setQueryData<ContentTypeMap[T]>(
        [`${type}-content`, slug, userId], 
        (old) => {
          if (!old || !data.stats || !data.interactions) return old
          return { 
            ...old, 
            stats: data.stats,
            interactions: data.interactions 
          }
        }
      )
      
      // Update all list caches with server data
      queryClient.setQueriesData(
        { queryKey: [`${type}-content`] },
        (oldQuery: unknown) => {
          if (!oldQuery || typeof oldQuery !== 'object') return oldQuery
          
          const old = oldQuery as Record<string, unknown>
          if (!old.data) return oldQuery
          
          // Handle different API response formats
          let items: unknown[]
          if (Array.isArray(old.data)) {
            items = old.data
          } else if (typeof old.data === 'object' && old.data !== null) {
            const dataObj = old.data as Record<string, unknown>
            items = (dataObj.posts || dataObj.guides || dataObj.monsters || dataObj) as unknown[]
          } else {
            return oldQuery
          }
          
          if (!Array.isArray(items)) return oldQuery
          
          const updatedItems = items.map((item) => {
            if (typeof item === 'object' && item !== null && 
                'slug' in item && item.slug === slug && 
                data.stats && data.interactions) {
              return { 
                ...item as ContentTypeMap[T], 
                stats: data.stats,
                interactions: data.interactions
              }
            }
            return item
          })
          
          // Preserve original response structure
          if (Array.isArray(old.data)) {
            return { ...old, data: updatedItems }
          } else {
            const dataObj = old.data as Record<string, unknown>
            const newData = { ...dataObj }
            if (dataObj.posts) newData.posts = updatedItems
            if (dataObj.guides) newData.guides = updatedItems
            if (dataObj.monsters) newData.monsters = updatedItems
            
            return {
              ...old,
              data: newData
            }
          }
        }
      )
      
      // Success feedback with modern UX
      const actionText = data.action === 'added' ? 'added' : 'removed'
      toast.success(`${action} ${actionText}!`, { duration: 2000 })
    }
  })
}

// ============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC CONTENT TYPES
// ============================================================================

/**
 * Convenience factory for creating typed content hooks
 */
export function createContentHooks<T extends ContentType>(type: T) {
  return {
    useContent: (options?: UseContentOptions<T>) => useContent(type, options),
    useInfiniteContent: (options?: UseInfiniteContentOptions<T>) => useInfiniteContent(type, options),
    useContentItem: (slug: string, options?: { enabled?: boolean; initialData?: ContentTypeMap[T] }) => 
      useContentItem(type, slug, options),
    useCreateContent: () => useCreateContent(type),
    useUpdateContent: () => useUpdateContent(type),  
    useDeleteContent: () => useDeleteContent(type),
    useContentInteraction: () => useContentInteraction(type)
  }
}

// Pre-configured hooks for each content type
export const forumHooks = createContentHooks('forum')
export const blogHooks = createContentHooks('blog')
export const wikiHooks = createContentHooks('wiki')
export const dexHooks = createContentHooks('dex')