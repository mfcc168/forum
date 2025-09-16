/**
 * Test Utilities
 * Custom render function and testing helpers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'

// Mock session data with flexible role typing
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'member' as 'member' | 'admin' | 'moderator',
    avatar: 'https://example.com/avatar.jpg'
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

export const mockAdminSession = {
  user: {
    id: 'admin-user-id',
    name: 'Admin User', 
    email: 'admin@example.com',
    role: 'admin' as 'member' | 'admin' | 'moderator',
    avatar: 'https://example.com/admin-avatar.jpg'
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: typeof mockSession | null
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  {
    session = mockSession,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </QueryClientProvider>
      </SessionProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render method
export { renderWithProviders as render }

// Test data generators
export const createMockWikiGuide = (overrides = {}) => ({
  id: 'test-guide-id',
  title: 'Test Wiki Guide',
  content: '<p>This is test content</p>',
  excerpt: 'This is a test excerpt',
  slug: 'test-wiki-guide',
  category: 'getting-started',
  difficulty: 'beginner' as const,
  tags: ['test', 'guide'],
  author: {
    id: 'test-author-id',
    name: 'Test Author',
    avatar: 'https://example.com/avatar.jpg'
  },
  stats: {
    viewsCount: 10,
    likesCount: 5,
    bookmarksCount: 3,
    sharesCount: 2,
    helpfulsCount: 8
  },
  interactions: {
    isLiked: false,
    isBookmarked: false,
    isShared: false,
    isHelpful: false
  },
  status: 'published' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockBlogPost = (overrides = {}) => ({
  id: 'test-blog-id',
  title: 'Test Blog Post',
  content: '<p>This is test blog content</p>',
  excerpt: 'This is a test blog excerpt',
  slug: 'test-blog-post',
  category: 'announcements',
  tags: ['test', 'announcement'],
  author: {
    id: 'test-author-id',
    name: 'Test Author',
    avatar: 'https://example.com/avatar.jpg'
  },
  stats: {
    viewsCount: 20,
    likesCount: 8,
    bookmarksCount: 4,
    sharesCount: 3
  },
  interactions: {
    isLiked: false,
    isBookmarked: false,
    isShared: false
  },
  status: 'published' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockForumPost = (overrides = {}) => ({
  id: 'test-forum-id',
  title: 'Test Forum Post',
  content: '<p>This is test forum content</p>',
  slug: 'test-forum-post',
  category: 'general',
  categoryName: 'General Discussion',
  tags: ['test', 'discussion'],
  author: {
    id: 'test-author-id',
    name: 'Test Author',
    avatar: 'https://example.com/avatar.jpg'
  },
  stats: {
    viewsCount: 15,
    repliesCount: 5,
    likesCount: 3
  },
  interactions: {
    isLiked: false,
    isBookmarked: false
  },
  isPinned: false,
  isLocked: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})

// API response helpers
export const createMockApiResponse = (data: unknown, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString()
})

export const createMockApiError = (message = 'Test error', code = 500) => ({
  success: false,
  error: {
    message,
    code,
    timestamp: new Date().toISOString()
  }
})