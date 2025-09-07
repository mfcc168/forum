/**
 * Unit tests for usePermissions hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { mockSession, mockAdminSession, createMockWikiGuide, createMockBlogPost, createMockForumPost } from '@/tests/utils/test-utils'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'

// Simple wrapper component for renderHook
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    
    return (
      <SessionProvider session={null}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </QueryClientProvider>
      </SessionProvider>
    )
  }
}

describe('usePermissions', () => {
  describe('Wiki Permissions', () => {
    it('returns correct permissions for admin user', () => {
      const guide = createMockWikiGuide({ author: { id: 'different-user', name: 'Other User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockAdminSession, 'wiki', guide),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true)
      expect(result.current.canEdit).toBe(true)
      expect(result.current.canDelete).toBe(true)
      expect(result.current.canViewDrafts).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isModerator).toBe(true)
      expect(result.current.isAuthor).toBe(false) // Different author
    })

    it('returns correct permissions for regular member', () => {
      const guide = createMockWikiGuide({ author: { id: 'test-user-id', name: 'Test User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockSession, 'wiki', guide),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(false) // Wiki is admin-only
      expect(result.current.canEdit).toBe(false)   // Wiki is admin-only
      expect(result.current.canDelete).toBe(false) // Wiki is admin-only
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
      expect(result.current.isAuthor).toBe(true) // Same author as mock session
    })

    it('returns correct permissions for unauthenticated user', () => {
      const guide = createMockWikiGuide()
      
      const { result } = renderHook(
        () => usePermissions(null, 'wiki', guide),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(false)
      expect(result.current.canEdit).toBe(false)
      expect(result.current.canDelete).toBe(false)
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
      expect(result.current.isAuthor).toBe(false)
    })
  })

  describe('Blog Permissions', () => {
    it('returns correct permissions for admin user', () => {
      const post = createMockBlogPost({ author: { id: 'different-user', name: 'Other User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockAdminSession, 'blog', post),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true)
      expect(result.current.canEdit).toBe(true)
      expect(result.current.canDelete).toBe(true)
      expect(result.current.canViewDrafts).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isModerator).toBe(true)
      expect(result.current.isAuthor).toBe(false) // Different author
    })

    it('returns correct permissions for regular member', () => {
      const post = createMockBlogPost({ author: { id: 'test-user-id', name: 'Test User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockSession, 'blog', post),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(false) // Blog is admin-only
      expect(result.current.canEdit).toBe(false)   // Blog is admin-only
      expect(result.current.canDelete).toBe(false) // Blog is admin-only
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
      expect(result.current.isAuthor).toBe(true) // Same author as mock session
    })
  })

  describe('Forum Permissions', () => {
    it('returns correct permissions for admin user', () => {
      const post = createMockForumPost({ author: { id: 'different-user', name: 'Other User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockAdminSession, 'forum', post),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true)
      expect(result.current.canEdit).toBe(true)   // Admin can edit any forum post
      expect(result.current.canDelete).toBe(true) // Admin can delete any forum post
      expect(result.current.canViewDrafts).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isModerator).toBe(true)
      expect(result.current.isAuthor).toBe(false) // Different author
    })

    it('returns correct permissions for regular member on own post', () => {
      const post = createMockForumPost({ author: { id: 'test-user-id', name: 'Test User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockSession, 'forum', post),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true) // All members can create forum posts
      expect(result.current.canEdit).toBe(true)   // Author can edit own post
      expect(result.current.canDelete).toBe(true) // Author can delete own post
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
      expect(result.current.isAuthor).toBe(true) // Same author as mock session
    })

    it('returns correct permissions for regular member on other post', () => {
      const post = createMockForumPost({ author: { id: 'different-user', name: 'Other User' } })
      
      const { result } = renderHook(
        () => usePermissions(mockSession, 'forum', post),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true)  // All members can create forum posts
      expect(result.current.canEdit).toBe(false)   // Cannot edit other's posts
      expect(result.current.canDelete).toBe(false) // Cannot delete other's posts
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
      expect(result.current.isAuthor).toBe(false) // Different author
    })

    it('returns correct permissions for moderator user', () => {
      const moderatorSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'moderator' as const }
      }
      const post = createMockForumPost({ author: { id: 'different-user', name: 'Other User' } })
      
      const { result } = renderHook(
        () => usePermissions(moderatorSession, 'forum', post),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true)
      expect(result.current.canEdit).toBe(false)   // Moderator CANNOT edit other's forum posts
      expect(result.current.canDelete).toBe(false) // Moderator CANNOT delete other's forum posts  
      expect(result.current.canViewDrafts).toBe(true) // Moderator can view drafts
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(true)
      expect(result.current.isAuthor).toBe(false) // Different author
    })
  })

  describe('Module-level Permissions (no content)', () => {
    it('returns correct module-level permissions for admin', () => {
      const { result } = renderHook(
        () => usePermissions(mockAdminSession, 'wiki'),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true)
      expect(result.current.canViewDrafts).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isModerator).toBe(true)
    })

    it('returns correct module-level permissions for regular member', () => {
      const { result } = renderHook(
        () => usePermissions(mockSession, 'forum'),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true) // Forum allows member creation
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
    })

    it('returns correct module-level permissions for regular member on restricted module', () => {
      const { result } = renderHook(
        () => usePermissions(mockSession, 'blog'),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(false) // Blog is admin-only
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles VIP role correctly', () => {
      const vipSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'vip' as const }
      }
      
      const { result } = renderHook(
        () => usePermissions(vipSession, 'forum'),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(true) // VIP can create forum posts
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false) // VIP is not considered moderator for permissions
    })

    it('handles banned role correctly', () => {
      const bannedSession = {
        ...mockSession,
        user: { ...mockSession.user, role: 'banned' as const }
      }
      
      const { result } = renderHook(
        () => usePermissions(bannedSession, 'forum'),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(false) // Banned users cannot create content
      expect(result.current.canEdit).toBe(false)
      expect(result.current.canDelete).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
    })

    it('handles missing content author gracefully', () => {
      const postWithoutAuthor = createMockForumPost()
      delete postWithoutAuthor.author
      
      const { result } = renderHook(
        () => usePermissions(mockSession, 'forum', postWithoutAuthor),
        { wrapper: createWrapper() }
      )

      expect(result.current.isAuthor).toBe(false)
      expect(result.current.canEdit).toBe(false)
      expect(result.current.canDelete).toBe(false)
    })

    it('handles undefined session gracefully', () => {
      const { result } = renderHook(
        () => usePermissions(undefined, 'wiki'),
        { wrapper: createWrapper() }
      )

      expect(result.current.canCreate).toBe(false)
      expect(result.current.canEdit).toBe(false)
      expect(result.current.canDelete).toBe(false)
      expect(result.current.canViewDrafts).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isModerator).toBe(false)
      expect(result.current.isAuthor).toBe(false)
    })
  })
})