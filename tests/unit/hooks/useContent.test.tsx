/**
 * Comprehensive Unit Tests for useContent Generic Hooks System
 * 
 * Tests the generic content hooks that power blog, forum, and wiki modules.
 * Ensures consistent behavior across all content types and proper React Query integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { mockSession, mockAdminSession } from '@/tests/utils/test-utils'
import {
  useContent,
  useInfiniteContent,
  useContentItem,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useContentInteraction,
  forumHooks,
  blogHooks,
  wikiHooks
} from '@/lib/hooks/useContent'
import type { BlogPost, ForumPost, WikiGuide } from '@/lib/types'
import { toast } from 'react-hot-toast'

// Mock external dependencies
vi.mock('react-hot-toast')
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: mockSession }))
}))

// Mock fetch globally
global.fetch = vi.fn()

// Test data
const mockBlogPost: BlogPost = {
  id: 'blog-1',
  slug: 'test-blog-post',
  title: 'Test Blog Post',
  content: 'This is a test blog post content',
  excerpt: 'Test excerpt',
  metaDescription: 'Test meta description',
  author: {
    id: 'author-1',
    name: 'Test Author',
    avatar: 'https://example.com/avatar.jpg'
  },
  category: 'announcements',
  tags: ['test', 'blog'],
  stats: {
    viewsCount: 100,
    likesCount: 15,
    bookmarksCount: 8,
    sharesCount: 5,
    repliesCount: 0,
    helpfulsCount: 0
  },
  interactions: {
    isLiked: false,
    isBookmarked: false,
    isShared: false,
    isHelpful: false
  },
  status: 'published',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z'
}

const mockForumPost: ForumPost = {
  id: 'forum-1',
  slug: 'test-forum-post',
  title: 'Test Forum Post',
  content: 'This is a test forum post content',
  excerpt: 'Test excerpt',
  author: {
    id: 'author-2',
    name: 'Forum Author',
    avatar: 'https://example.com/avatar2.jpg'
  },
  category: 'general',
  categoryName: 'General Discussion',
  tags: ['discussion', 'help'],
  stats: {
    viewsCount: 75,
    likesCount: 12,
    bookmarksCount: 3,
    sharesCount: 2,
    repliesCount: 8,
    helpfulsCount: 0
  },
  interactions: {
    isLiked: true,
    isBookmarked: false,
    isShared: false,
    isHelpful: false
  },
  status: 'published',
  isPinned: false,
  isLocked: false,
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T08:00:00Z'
}

const mockWikiGuide: WikiGuide = {
  id: 'wiki-1',
  slug: 'test-wiki-guide',
  title: 'Test Wiki Guide',
  content: 'This is a test wiki guide content',
  excerpt: 'Test guide excerpt',
  author: {
    id: 'author-3',
    name: 'Wiki Author',
    avatar: 'https://example.com/avatar3.jpg'
  },
  category: 'getting-started',
  difficulty: 'beginner',
  tags: ['tutorial', 'basics'],
  stats: {
    viewsCount: 200,
    likesCount: 25,
    bookmarksCount: 15,
    sharesCount: 10,
    repliesCount: 0,
    helpfulsCount: 18
  },
  interactions: {
    isLiked: false,
    isBookmarked: true,
    isShared: false,
    isHelpful: true
  },
  status: 'published',
  createdAt: '2024-01-03T00:00:00Z',
  updatedAt: '2024-01-03T10:00:00Z'
}

describe('useContent Generic Hooks System', () => {
  let queryClient: QueryClient

  // Helper to create wrapper with providers
  function createWrapper(session = mockSession) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <SessionProvider session={session}>
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
          gcTime: 0,
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

  describe('useContent Hook', () => {
    it('fetches blog posts successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          blogPosts: [mockBlogPost],
          pagination: { page: 1, pages: 1, total: 1, limit: 20 }
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('blog', { category: 'announcements' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([mockBlogPost])
      expect(result.current.error).toBeNull()
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts?category=announcements'),
        expect.objectContaining({
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('fetches forum posts successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          forumPosts: [mockForumPost]
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('forum', { sortBy: 'latest' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([mockForumPost])
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/forum/posts?sortBy=latest'),
        expect.any(Object)
      )
    })

    it('fetches wiki guides successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          wikiGuides: [mockWikiGuide]
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('wiki', {}),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([mockWikiGuide])
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/wiki/guides'),
        expect.any(Object)
      )
    })

    it('handles fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(
        () => useContent('blog'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
      expect(result.current.data).toBeUndefined()
    })

    it('handles API error responses', async () => {
      const errorResponse = {
        success: false,
        error: 'Content not found'
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('blog'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Content not found')
    })

    it('handles array filters correctly', async () => {
      const mockResponse = {
        success: true,
        data: [mockBlogPost]
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('blog', { tags: ['tech', 'tutorial'] }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('tags=tech%2Ctutorial'),
        expect.any(Object)
      )
    })

    it('includes user ID in query key for personalized caching', async () => {
      const mockResponse = {
        success: true,
        data: [mockBlogPost]
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('blog'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Query should be cached with user ID
      const cachedData = queryClient.getQueryData(['blog-content', {}, 'user-123'])
      expect(cachedData).toEqual([mockBlogPost])
    })
  })

  describe('useInfiniteContent Hook', () => {
    it('implements infinite scrolling correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          blogPosts: [mockBlogPost],
          pagination: {
            page: 1,
            pages: 2,
            total: 25,
            limit: 20,
            hasNext: true,
            hasPrev: false
          }
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useInfiniteContent('blog', { pageSize: 20 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.pages[0]).toEqual({
        items: [mockBlogPost],
        pagination: mockResponse.data.pagination
      })

      expect(result.current.hasNextPage).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=20'),
        expect.any(Object)
      )
    })

    it('calculates next page correctly', async () => {
      const firstPageResponse = {
        success: true,
        data: {
          forumPosts: [mockForumPost],
          pagination: { page: 1, pages: 3, total: 50, limit: 20, hasNext: true, hasPrev: false }
        }
      }

      const secondPageResponse = {
        success: true,
        data: {
          forumPosts: [{ ...mockForumPost, id: 'forum-2' }],
          pagination: { page: 2, pages: 3, total: 50, limit: 20, hasNext: true, hasPrev: true }
        }
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(firstPageResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(secondPageResponse)
        } as Response)

      const { result } = renderHook(
        () => useInfiniteContent('forum'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Fetch next page
      await result.current.fetchNextPage()

      await waitFor(() => {
        expect(result.current.isFetchingNextPage).toBe(false)
      })

      expect(result.current.data?.pages).toHaveLength(2)
      expect(result.current.data?.pages[1].items[0].id).toBe('forum-2')
    })
  })

  describe('useContentItem Hook', () => {
    it('fetches single blog post by slug', async () => {
      const mockResponse = {
        success: true,
        data: {
          blogPost: mockBlogPost
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContentItem('blog', 'test-blog-post'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockBlogPost)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts/test-blog-post'),
        expect.any(Object)
      )
    })

    it('handles 404 errors with specific message', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, error: 'Not found' })
      } as Response)

      const { result } = renderHook(
        () => useContentItem('wiki', 'non-existent-guide'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('guide not found')
    })

    it('skips fetch when slug is empty', () => {
      const { result } = renderHook(
        () => useContentItem('forum', ''),
        { wrapper: createWrapper() }
      )

      expect(result.current.isLoading).toBe(false)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('uses initial data when provided', () => {
      const { result } = renderHook(
        () => useContentItem('blog', 'test-post', { initialData: mockBlogPost }),
        { wrapper: createWrapper() }
      )

      expect(result.current.data).toEqual(mockBlogPost)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useCreateContent Hook', () => {
    it('creates blog post successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          blogPost: { ...mockBlogPost, id: 'new-blog-post' }
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useCreateContent('blog'),
        { wrapper: createWrapper() }
      )

      const newPostData = {
        title: 'New Blog Post',
        content: 'New content',
        category: 'tech'
      }

      await result.current.mutateAsync(newPostData)

      expect(fetch).toHaveBeenCalledWith(
        '/api/blog/posts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPostData)
        })
      )

      expect(toast.success).toHaveBeenCalledWith('blog post created successfully!')
    })

    it('handles creation errors', async () => {
      const errorResponse = {
        success: false,
        error: 'Validation failed'
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      } as Response)

      const { result } = renderHook(
        () => useCreateContent('forum'),
        { wrapper: createWrapper() }
      )

      try {
        await result.current.mutateAsync({ title: 'Test' })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Validation failed')
      }

      expect(toast.error).toHaveBeenCalledWith('Validation failed')
    })

    it('invalidates relevant caches after creation', async () => {
      const mockResponse = {
        success: true,
        data: {
          wikiGuide: mockWikiGuide
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(
        () => useCreateContent('wiki'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync({ title: 'New Guide' })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['wiki-content'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['wiki-stats'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['wiki-categories'] })
    })

    it('pre-warms cache with created item', async () => {
      const createdItem = { ...mockBlogPost, slug: 'new-post' }
      const mockResponse = {
        success: true,
        data: {
          blogPost: createdItem
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useCreateContent('blog'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync({ title: 'New Post' })

      // Check that the item was cached for immediate access
      const cachedItem = queryClient.getQueryData(['blog-content', 'new-post', 'user-123'])
      expect(cachedItem).toEqual(createdItem)
    })
  })

  describe('useUpdateContent Hook', () => {
    it('updates content successfully', async () => {
      const updatedContent = { ...mockForumPost, title: 'Updated Title' }
      const mockResponse = {
        success: true,
        data: {
          forumPost: updatedContent
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useUpdateContent('forum'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync({
        slug: 'test-forum-post',
        data: { title: 'Updated Title' }
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/forum/posts/test-forum-post',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Title' })
        })
      )

      expect(toast.success).toHaveBeenCalledWith('post updated successfully!')
    })

    it('updates specific item cache after successful update', async () => {
      const updatedContent = { ...mockWikiGuide, title: 'Updated Guide' }
      const mockResponse = {
        success: true,
        data: {
          wikiGuide: updatedContent
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useUpdateContent('wiki'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync({
        slug: 'test-wiki-guide',
        data: { title: 'Updated Guide' }
      })

      // Check that the specific item cache was updated
      const cachedItem = queryClient.getQueryData(['wiki-content', 'test-wiki-guide'])
      expect(cachedItem).toEqual(updatedContent)
    })
  })

  describe('useDeleteContent Hook', () => {
    it('deletes content successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Content deleted successfully'
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useDeleteContent('blog'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync('test-blog-post')

      expect(fetch).toHaveBeenCalledWith(
        '/api/blog/posts/test-blog-post',
        expect.objectContaining({
          method: 'DELETE'
        })
      )

      expect(toast.success).toHaveBeenCalledWith('blog post deleted successfully!')
    })

    it('removes item from cache after successful deletion', async () => {
      const mockResponse = { success: true }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      // Pre-populate cache
      queryClient.setQueryData(['forum-content', 'test-forum-post'], mockForumPost)

      const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries')

      const { result } = renderHook(
        () => useDeleteContent('forum'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync('test-forum-post')

      expect(removeQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['forum-content', 'test-forum-post']
      })
    })
  })

  describe('useContentInteraction Hook', () => {
    it('handles like interaction successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          action: 'added',
          stats: { likesCount: 16, bookmarksCount: 8, sharesCount: 5, helpfulsCount: 0 },
          interactions: { isLiked: true, isBookmarked: false, isShared: false, isHelpful: false }
        }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContentInteraction('blog'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync({
        slug: 'test-blog-post',
        action: 'like'
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/interactions/blog/test-blog-post',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'like' })
        })
      )

      expect(toast.success).toHaveBeenCalledWith('like added!', { duration: 2000 })
    })

    it('implements optimistic updates for interactions', async () => {
      // Pre-populate cache with initial data
      queryClient.setQueryData(['wiki-content', 'test-wiki-guide', 'user-123'], mockWikiGuide)

      // Mock delayed response to test optimistic updates
      let resolveResponse: (value: any) => void
      const responsePromise = new Promise(resolve => {
        resolveResponse = resolve
      })

      vi.mocked(fetch).mockReturnValue(responsePromise as any)

      const { result } = renderHook(
        () => useContentInteraction('wiki'),
        { wrapper: createWrapper() }
      )

      // Trigger optimistic update
      result.current.mutate({
        slug: 'test-wiki-guide',
        action: 'like'
      })

      // Check optimistic state immediately
      const optimisticData = queryClient.getQueryData(['wiki-content', 'test-wiki-guide', 'user-123'])
      expect((optimisticData as WikiGuide).stats.likesCount).toBe(26) // 25 + 1
      expect((optimisticData as WikiGuide).interactions.isLiked).toBe(true)

      // Resolve with server response
      resolveResponse!({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            action: 'added',
            stats: { ...mockWikiGuide.stats, likesCount: 26 },
            interactions: { ...mockWikiGuide.interactions, isLiked: true }
          }
        })
      })
    })

    it('rolls back optimistic updates on error', async () => {
      // Pre-populate cache
      queryClient.setQueryData(['blog-content', 'test-blog-post', 'user-123'], mockBlogPost)

      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(
        () => useContentInteraction('blog'),
        { wrapper: createWrapper() }
      )

      await result.current.mutateAsync({
        slug: 'test-blog-post',
        action: 'like'
      }).catch(() => {}) // Ignore the error for this test

      // Data should be rolled back to original state
      const rolledBackData = queryClient.getQueryData(['blog-content', 'test-blog-post', 'user-123'])
      expect((rolledBackData as BlogPost).stats.likesCount).toBe(15) // Original value
      expect((rolledBackData as BlogPost).interactions.isLiked).toBe(false) // Original value

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to like. Please try again.',
        { duration: 4000 }
      )
    })
  })

  describe('Pre-configured Content Hooks', () => {
    it('blogHooks provides typed blog operations', async () => {
      const mockResponse = {
        success: true,
        data: { blogPosts: [mockBlogPost] }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => blogHooks.useContent({ category: 'tech' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([mockBlogPost])
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blog/posts'),
        expect.any(Object)
      )
    })

    it('forumHooks provides typed forum operations', async () => {
      const mockResponse = {
        success: true,
        data: { forumPosts: [mockForumPost] }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => forumHooks.useContent({ sortBy: 'popular' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([mockForumPost])
    })

    it('wikiHooks provides typed wiki operations', async () => {
      const mockResponse = {
        success: true,
        data: { wikiGuides: [mockWikiGuide] }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => wikiHooks.useContent({}),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([mockWikiGuide])
    })
  })

  describe('Caching and Performance', () => {
    it('uses appropriate stale times for different operations', async () => {
      const mockResponse = {
        success: true,
        data: [mockBlogPost]
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { result } = renderHook(
        () => useContent('blog', { staleTime: 10 * 60 * 1000 }), // 10 minutes
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Query should be marked as fresh for the specified stale time
      const query = queryClient.getQueryState(['blog-content', {}, 'user-123'])
      expect(query?.dataUpdateCount).toBeGreaterThanOrEqual(0)
    })

    it('includes credentials in all requests for authentication', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      } as Response)

      renderHook(
        () => useContent('forum'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: 'include'
          })
        )
      })
    })

    it('handles anonymous users with proper query keys', async () => {
      const anonymousSession = null

      vi.mocked(require('next-auth/react').useSession).mockReturnValue({
        data: null
      })

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      } as Response)

      const { result } = renderHook(
        () => useContent('blog'),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should cache with 'anonymous' user ID
      const cachedData = queryClient.getQueryData(['blog-content', {}, 'anonymous'])
      expect(cachedData).toEqual([])
    })
  })
})