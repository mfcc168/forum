/**
 * Blog-Specific Hooks
 * 
 * Lightweight wrapper around generic content hooks with blog-specific functionality.
 */

import { blogHooks, type UseContentOptions, type UseInfiniteContentOptions } from './useContent'
import { useQuery } from '@tanstack/react-query'
import type { BlogCategory, BlogStats, BlogPost } from '@/lib/types'

// ============================================================================
// BLOG-SPECIFIC OPTIONS
// ============================================================================

export interface UseBlogPostsOptions extends UseContentOptions<'blog'> {
  category?: string
  featuredOnly?: boolean
  sortBy?: 'latest' | 'popular' | 'trending' | 'oldest'
}

// ============================================================================
// MAIN BLOG HOOKS
// ============================================================================

/**
 * Fetch blog posts with filtering and pagination
 */
export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  return blogHooks.useContent(options)
}

/**
 * Infinite scrolling blog posts
 */
export function useInfiniteBlogPosts(options: Omit<UseBlogPostsOptions, 'page'> = {}) {
  return blogHooks.useInfiniteContent(options as UseInfiniteContentOptions<'blog'>)
}

/**
 * Fetch single blog post by slug
 */
export function useBlogPost(slug: string, options: { 
  enabled?: boolean; 
  initialData?: BlogPost;
  refetchOnMount?: boolean;
  staleTime?: number;
} = {}) {
  return blogHooks.useContentItem(slug, options)
}

/**
 * Create new blog post
 */
export function useCreateBlogPost() {
  return blogHooks.useCreateContent()
}

/**
 * Update existing blog post
 */
export function useUpdateBlogPost() {
  return blogHooks.useUpdateContent()
}

/**
 * Delete blog post
 */
export function useDeleteBlogPost() {
  return blogHooks.useDeleteContent()
}

/**
 * Blog post interactions (like, bookmark, share)
 */
export function useBlogPostInteraction() {
  return blogHooks.useContentInteraction()
}

// ============================================================================
// BLOG-SPECIFIC HOOKS
// ============================================================================

/**
 * Fetch blog categories
 */
export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async (): Promise<BlogCategory[]> => {
      const response = await fetch('/api/blog/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch blog categories')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch blog categories')
      }
      
      return result.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}


/**
 * Get blog statistics
 */
export function useBlogStats() {
  return useQuery({
    queryKey: ['blog-stats'],
    queryFn: async (): Promise<BlogStats> => {
      const response = await fetch('/api/stats/blog')
      if (!response.ok) {
        throw new Error('Failed to fetch blog statistics')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch blog statistics')
      }
      
      return result.data
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}

/**
 * Get popular blog posts
 */
export function usePopularBlogPosts(limit = 10) {
  return useQuery({
    queryKey: ['popular-blog-posts', limit],
    queryFn: async (): Promise<BlogPost[]> => {
      const response = await fetch(`/api/blog/posts?sortBy=popular&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error('Failed to fetch popular blog posts')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch popular blog posts')
      }
      
      return result.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Get recent blog posts
 */
export function useRecentBlogPosts(limit = 10) {
  return useQuery({
    queryKey: ['recent-blog-posts', limit],
    queryFn: async (): Promise<BlogPost[]> => {
      const response = await fetch(`/api/blog/posts?sortBy=latest&limit=${limit}&status=published`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent blog posts')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent blog posts')
      }
      
      return result.data || []
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes - matches other recent hooks
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}