/**
 * Forum-Specific Hooks
 * 
 * Lightweight wrapper around generic content hooks with forum-specific functionality.
 */

import { forumHooks, type UseContentOptions, type UseInfiniteContentOptions } from './useContent'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { ForumCategory, ForumPost } from '@/lib/types'

// ============================================================================
// FORUM-SPECIFIC OPTIONS
// ============================================================================

export interface UseForumPostsOptions extends UseContentOptions<'forum'> {
  category?: string
  categoryName?: string
  isPinned?: boolean
  isLocked?: boolean
  sortBy?: 'latest' | 'popular' | 'trending' | 'oldest' | 'replies'
}

// ============================================================================
// MAIN FORUM HOOKS
// ============================================================================

/**
 * Fetch forum posts with filtering and pagination
 */
export function useForumPosts(options: UseForumPostsOptions = {}) {
  return forumHooks.useContent(options)
}

/**
 * Infinite scrolling forum posts
 */
export function useInfiniteForumPosts(options: Omit<UseForumPostsOptions, 'page'> = {}) {
  return forumHooks.useInfiniteContent(options as UseInfiniteContentOptions<'forum'>)
}

/**
 * Fetch single forum post by slug
 */
export function useForumPost(slug: string, options: { 
  enabled?: boolean; 
  initialData?: ForumPost;
  refetchOnMount?: boolean;
  staleTime?: number;
} = {}) {
  return forumHooks.useContentItem(slug, options)
}

/**
 * Create new forum post
 */
export function useCreateForumPost() {
  return forumHooks.useCreateContent()
}

/**
 * Update existing forum post
 */
export function useUpdateForumPost() {
  return forumHooks.useUpdateContent()
}

/**
 * Delete forum post
 */
export function useDeleteForumPost() {
  return forumHooks.useDeleteContent()
}

/**
 * Forum post interactions (like, bookmark, share)
 */
export function useForumPostInteraction() {
  return forumHooks.useContentInteraction()
}

// ============================================================================
// FORUM-SPECIFIC HOOKS
// ============================================================================


/**
 * Get forum statistics
 */
export function useForumStats() {
  return useQuery({
    queryKey: ['forum-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats/forum')
      if (!response.ok) {
        throw new Error('Failed to fetch forum statistics')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch forum statistics')
      }
      
      return result.data
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}

/**
 * Fetch forum categories
 */
export function useForumCategories() {
  return useQuery({
    queryKey: ['forum-categories'],
    queryFn: async (): Promise<ForumCategory[]> => {
      const response = await fetch('/api/forum/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch forum categories')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch forum categories')
      }
      
      return result.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories change rarely
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Admin action for forum posts (pin, lock, etc.)
 */
export function useAdminPostAction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      slug, 
      action, 
      value 
    }: { 
      slug: string
      action: 'pin' | 'lock' | 'feature'
      value: boolean 
    }) => {
      const response = await fetch(`/api/forum/posts/${slug}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} post`)
      }
      
      return response.json()
    },
    onSuccess: (data, { slug, action, value }) => {
      // Update post in cache
      queryClient.setQueryData(['forum-content', slug], (old: ForumPost | undefined) => {
        if (!old) return old
        return {
          ...old,
          isPinned: action === 'pin' ? value : old.isPinned,
          isLocked: action === 'lock' ? value : old.isLocked
        }
      })
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: ['forum-content'] })
      
      toast.success(`Post ${value ? action + 'ned' : 'un' + action + 'ned'} successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

/**
 * Get popular forum posts
 */
export function usePopularForumPosts(limit = 10) {
  return useQuery({
    queryKey: ['popular-forum-posts', limit],
    queryFn: async (): Promise<ForumPost[]> => {
      const response = await fetch(`/api/forum/posts?sortBy=popular&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error('Failed to fetch popular forum posts')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch popular forum posts')
      }
      
      return result.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Get recent forum posts
 */
export function useRecentForumPosts(limit = 10) {
  return useQuery({
    queryKey: ['recent-forum-posts', limit],
    queryFn: async (): Promise<ForumPost[]> => {
      const response = await fetch(`/api/forum/posts?sortBy=latest&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent forum posts')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent forum posts')
      }
      
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes - matches other recent hooks
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}