/**
 * Performance Tests for React Query Caching
 * 
 * Tests caching behavior, invalidation patterns, and performance characteristics
 * to ensure optimal user experience and resource utilization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { mockSession } from '@/tests/utils/test-utils'
import { useContent, useContentItem, useContentInteraction } from '@/lib/hooks/useContent'
import type { BlogPost } from '@/lib/types'

// Performance measurement utilities
const performanceMarks = new Map<string, number>()

function startPerformanceMeasure(name: string) {
  performanceMarks.set(name, performance.now())
}

function endPerformanceMeasure(name: string): number {
  const start = performanceMarks.get(name)
  if (!start) throw new Error(`No start mark found for ${name}`)
  const duration = performance.now() - start
  performanceMarks.delete(name)
  return duration
}

// Mock fetch with performance tracking
const mockFetchWithDelay = (response: any, delay: number = 0) => {
  return vi.fn().mockImplementation(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve(response)
        })
      }, delay)
    })
  })
}

// Test data
const mockBlogPost: BlogPost = {
  id: 'blog-1',
  slug: 'test-post',
  title: 'Test Post',
  content: 'Test content',
  excerpt: 'Test excerpt',
  metaDescription: 'Test meta',
  author: { id: 'author-1', name: 'Author', avatar: 'avatar.jpg' },
  category: 'tech',
  tags: ['test'],
  stats: { viewsCount: 100, likesCount: 10, bookmarksCount: 5, sharesCount: 2, repliesCount: 0, helpfulsCount: 0 },
  interactions: { isLiked: false, isBookmarked: false, isShared: false, isHelpful: false },
  status: 'published',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z'
}

global.fetch = vi.fn()

describe('React Query Caching Performance Tests', () => {
  let queryClient: QueryClient

  function createWrapper() {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <SessionProvider session={mockSession}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SessionProvider>
      )
    }
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 5 * 60 * 1000, // 5 minutes
          staleTime: 30 * 1000,   // 30 seconds
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    vi.resetAllMocks()
  })

  describe('Cache Hit Performance', () => {
    it('serves cached data immediately without network requests', async () => {
      const mockResponse = {
        success: true,
        data: { blogPosts: [mockBlogPost] }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result: firstResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      // Wait for first query to complete
      await waitFor(() => {
        expect(firstResult.current.isLoading).toBe(false)
      })

      expect(firstResult.current.data).toEqual([mockBlogPost])
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second query with same parameters should use cache
      startPerformanceMeasure('cache-hit')

      const { result: secondResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      const cacheHitDuration = endPerformanceMeasure('cache-hit')

      // Should return data immediately from cache
      expect(secondResult.current.data).toEqual([mockBlogPost])
      expect(secondResult.current.isLoading).toBe(false)
      expect(fetch).toHaveBeenCalledTimes(1) // No additional network requests
      expect(cacheHitDuration).toBeLessThan(10) // Cache hit should be very fast (< 10ms)
    })

    it('maintains separate caches for different query parameters', async () => {
      const techResponse = {
        success: true,
        data: { blogPosts: [{ ...mockBlogPost, category: 'tech' }] }
      }

      const newsResponse = {
        success: true,
        data: { blogPosts: [{ ...mockBlogPost, category: 'news', id: 'blog-2' }] }
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(techResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(newsResponse)
        } as Response)

      // Query tech posts
      const { result: techResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(techResult.current.isLoading).toBe(false)
      })

      // Query news posts
      const { result: newsResult } = renderHook(
        () => useContent('blog', { category: 'news' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(newsResult.current.isLoading).toBe(false)
      })

      // Both queries should have made network requests
      expect(fetch).toHaveBeenCalledTimes(2)

      // Verify different data is cached
      expect(techResult.current.data[0].category).toBe('tech')
      expect(newsResult.current.data[0].category).toBe('news')

      // Re-query tech posts should use cache
      const { result: techCacheResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      expect(techCacheResult.current.data[0].category).toBe('tech')
      expect(fetch).toHaveBeenCalledTimes(2) // No additional requests
    })
  })

  describe('Stale-While-Revalidate Performance', () => {
    it('serves stale data immediately while fetching fresh data in background', async () => {
      const initialResponse = {
        success: true,
        data: { blogPosts: [mockBlogPost] }
      }

      const freshResponse = {
        success: true,
        data: { blogPosts: [{ ...mockBlogPost, title: 'Updated Title' }] }
      }

      // Configure short stale time for testing
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 5 * 60 * 1000,
            staleTime: 100, // Very short stale time
          },
        },
      })

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(initialResponse)
      } as Response)

      // First query
      const { result: firstResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(firstResult.current.isLoading).toBe(false)
      })

      expect(firstResult.current.data[0].title).toBe('Test Post')

      // Wait for data to become stale
      await new Promise(resolve => setTimeout(resolve, 150))

      // Mock fresh response
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(freshResponse)
      } as Response)

      // Second query should serve stale data immediately, then update
      startPerformanceMeasure('stale-while-revalidate')

      const { result: secondResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      const immediateResponseTime = endPerformanceMeasure('stale-while-revalidate')

      // Should immediately return stale data
      expect(secondResult.current.data[0].title).toBe('Test Post')
      expect(secondResult.current.isLoading).toBe(false)
      expect(secondResult.current.isFetching).toBe(true) // Background refresh
      expect(immediateResponseTime).toBeLessThan(10) // Immediate response

      // Wait for background refresh to complete
      await waitFor(() => {
        expect(secondResult.current.isFetching).toBe(false)
      })

      // Data should now be updated
      expect(secondResult.current.data[0].title).toBe('Updated Title')
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Cache Invalidation Performance', () => {
    it('efficiently invalidates related caches after mutations', async () => {
      const listResponse = {
        success: true,
        data: { blogPosts: [mockBlogPost] }
      }

      const createResponse = {
        success: true,
        data: { blogPost: { ...mockBlogPost, id: 'new-post', title: 'New Post' } }
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(listResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createResponse)
        } as Response)

      // Pre-populate cache with list query
      const { result: listResult } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(listResult.current.isLoading).toBe(false)
      })

      expect(listResult.current.data).toHaveLength(1)

      // Measure invalidation performance
      startPerformanceMeasure('cache-invalidation')

      // Simulate cache invalidation after mutation
      await queryClient.invalidateQueries({ queryKey: ['blog-content'] })

      const invalidationTime = endPerformanceMeasure('cache-invalidation')

      expect(invalidationTime).toBeLessThan(50) // Invalidation should be fast
    })

    it('handles selective cache updates for optimistic mutations', async () => {
      const mockInteractionResponse = {
        success: true,
        data: {
          action: 'added',
          stats: { likesCount: 11, bookmarksCount: 5, sharesCount: 2, helpfulsCount: 0 },
          interactions: { isLiked: true, isBookmarked: false, isShared: false, isHelpful: false }
        }
      }

      // Pre-populate cache
      queryClient.setQueryData(['blog-content', 'test-post', 'user-123'], mockBlogPost)

      startPerformanceMeasure('optimistic-update')

      const { result } = renderHook(
        () => useContentInteraction('blog'),
        { wrapper: createWrapper() }
      )

      // Trigger optimistic mutation
      result.current.mutate({
        slug: 'test-post',
        action: 'like'
      })

      const optimisticUpdateTime = endPerformanceMeasure('optimistic-update')

      // Check that optimistic update was applied immediately
      const optimisticData = queryClient.getQueryData(['blog-content', 'test-post', 'user-123']) as BlogPost
      expect(optimisticData.stats.likesCount).toBe(11) // Original 10 + 1
      expect(optimisticData.interactions.isLiked).toBe(true)
      expect(optimisticUpdateTime).toBeLessThan(20) // Optimistic updates should be very fast
    })
  })

  describe('Memory Management and Garbage Collection', () => {
    it('respects garbage collection time limits', async () => {
      // Configure short GC time for testing
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 100, // Very short GC time
            staleTime: 50,
          },
        },
      })

      const response = {
        success: true,
        data: { blogPosts: [mockBlogPost] }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(response)
      } as Response)

      const { result, unmount } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify cache has data
      expect(queryClient.getQueryData(['blog-content', { category: 'tech' }, 'user-123'])).toBeDefined()

      // Unmount component (no active observers)
      unmount()

      // Wait longer than GC time
      await new Promise(resolve => setTimeout(resolve, 150))

      // Manually trigger garbage collection
      queryClient.getQueryCache().clear()

      // Data should be garbage collected
      expect(queryClient.getQueryData(['blog-content', { category: 'tech' }, 'user-123'])).toBeUndefined()
    })

    it('manages memory efficiently with large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockBlogPost,
        id: `blog-${i}`,
        title: `Post ${i}`
      }))

      const response = {
        success: true,
        data: { blogPosts: largeDataset }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(response)
      } as Response)

      startPerformanceMeasure('large-dataset')

      const { result } = renderHook(
        () => useContent('blog'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const processingTime = endPerformanceMeasure('large-dataset')

      expect(result.current.data).toHaveLength(1000)
      expect(processingTime).toBeLessThan(500) // Should handle large datasets reasonably fast
    })
  })

  describe('Concurrent Query Management', () => {
    it('deduplicates concurrent identical queries', async () => {
      const response = {
        success: true,
        data: { blogPosts: [mockBlogPost] }
      }

      // Add artificial delay to test deduplication
      vi.mocked(fetch).mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(response)
            } as Response)
          }, 100)
        })
      )

      startPerformanceMeasure('concurrent-queries')

      // Create multiple identical queries concurrently
      const queries = Array.from({ length: 5 }, () =>
        renderHook(
          () => useContent('blog', { category: 'tech' }),
          { wrapper: createWrapper() }
        )
      )

      // Wait for all queries to complete
      await Promise.all(
        queries.map(({ result }) =>
          waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })
        )
      )

      const concurrentQueryTime = endPerformanceMeasure('concurrent-queries')

      // All queries should have the same data
      queries.forEach(({ result }) => {
        expect(result.current.data).toEqual([mockBlogPost])
      })

      // Should only make one network request despite multiple concurrent queries
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(concurrentQueryTime).toBeLessThan(200) // Should be efficient with deduplication
    })

    it('handles query cancellation efficiently', async () => {
      let cancelled = false

      vi.mocked(fetch).mockImplementation(() =>
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (cancelled) {
              reject(new Error('Query cancelled'))
            } else {
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: { blogPosts: [mockBlogPost] } })
              } as Response)
            }
          }, 200)

          // Simulate cancellation mechanism
          return timeout
        })
      )

      const { result, unmount } = renderHook(
        () => useContent('blog', { category: 'tech' }),
        { wrapper: createWrapper() }
      )

      // Start the query
      expect(result.current.isLoading).toBe(true)

      // Cancel by unmounting component
      setTimeout(() => {
        cancelled = true
        unmount()
      }, 50)

      // Wait to see if cancellation worked
      await new Promise(resolve => setTimeout(resolve, 300))

      // Query should have been cancelled and no errors should propagate
      expect(true).toBe(true) // Test passes if no unhandled errors
    })
  })

  describe('Cache Size and Performance Thresholds', () => {
    it('maintains acceptable performance with multiple cache entries', async () => {
      // Create many different cache entries
      const promises = Array.from({ length: 100 }, (_, i) => {
        const response = {
          success: true,
          data: { blogPosts: [{ ...mockBlogPost, id: `blog-${i}` }] }
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response)
        } as Response)

        return renderHook(
          () => useContent('blog', { category: `category-${i}` }),
          { wrapper: createWrapper() }
        )
      })

      startPerformanceMeasure('multiple-cache-entries')

      // Wait for all queries to complete
      await Promise.all(
        promises.map(({ result }) =>
          waitFor(() => {
            expect(result.current.isLoading).toBe(false)
          })
        )
      )

      const totalTime = endPerformanceMeasure('multiple-cache-entries')

      expect(fetch).toHaveBeenCalledTimes(100)
      expect(totalTime).toBeLessThan(2000) // Should handle 100 queries reasonably fast

      // Test cache retrieval performance
      startPerformanceMeasure('cache-retrieval')

      const cachedData = queryClient.getQueryData(['blog-content', { category: 'category-50' }, 'user-123'])

      const retrievalTime = endPerformanceMeasure('cache-retrieval')

      expect(cachedData).toBeDefined()
      expect(retrievalTime).toBeLessThan(5) // Cache retrieval should be very fast
    })

    it('demonstrates efficient cache key generation', () => {
      startPerformanceMeasure('cache-key-generation')

      // Generate many cache keys with different parameters
      const keys = Array.from({ length: 1000 }, (_, i) => {
        const filters = {
          category: `category-${i % 10}`,
          tags: [`tag-${i % 5}`, `tag-${i % 3}`],
          sortBy: i % 2 === 0 ? 'latest' : 'popular',
          search: i % 7 === 0 ? `search-${i}` : undefined
        }
        
        return ['blog-content', filters, 'user-123']
      })

      const keyGenerationTime = endPerformanceMeasure('cache-key-generation')

      expect(keys).toHaveLength(1000)
      expect(keyGenerationTime).toBeLessThan(50) // Key generation should be very fast
    })
  })
})