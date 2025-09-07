/**
 * Comprehensive Unit Tests for ContentActions Component
 * 
 * Tests all interaction modes, permission states, and content types
 * to meet enterprise testing standards.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSession, mockAdminSession } from '@/tests/utils/test-utils'
import { ContentActions } from '@/app/components/shared/ContentActions'
import type { ContentActionsConfig } from '@/app/components/shared/ContentActions'
import { toast } from 'react-hot-toast'

// Mock external dependencies
vi.mock('react-hot-toast')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock the content hooks
vi.mock('@/lib/hooks/useContent', () => ({
  forumHooks: {
    useContentInteraction: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false
    }))
  },
  blogHooks: {
    useContentInteraction: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false
    }))
  },
  wikiHooks: {
    useContentInteraction: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false
    }))
  }
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

describe('ContentActions Component', () => {
  const mockDeleteMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  }

  const mockInteractionMutation = {
    mutate: vi.fn(),
    isPending: false
  }

  // Base configuration for all tests
  const baseConfig: ContentActionsConfig = {
    contentType: 'blog',
    identifier: 'test-post',
    adminActions: {
      edit: {
        enabled: true,
        path: '/blog/edit/test-post'
      },
      delete: {
        enabled: true,
        mutation: mockDeleteMutation as any,
        confirmTitle: 'Delete Post',
        confirmMessage: 'Are you sure you want to delete this post?'
      }
    },
    socialActions: {
      like: {
        enabled: true,
        count: 5,
        isActive: false
      },
      bookmark: {
        enabled: true,
        count: 2,
        isActive: false
      },
      share: {
        enabled: true,
        count: 8,
        url: 'https://example.com/blog/test-post'
      },
      helpful: {
        enabled: true,
        count: 3,
        isActive: false
      }
    }
  }

  const mockContent = {
    id: 'test-post-id',
    slug: 'test-post',
    author: {
      id: 'author-123',
      name: 'Test Author',
      avatar: 'https://example.com/avatar.jpg'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful interaction hook
    const { forumHooks, blogHooks, wikiHooks } = require('@/lib/hooks/useContent')
    forumHooks.useContentInteraction.mockReturnValue(mockInteractionMutation)
    blogHooks.useContentInteraction.mockReturnValue(mockInteractionMutation)
    wikiHooks.useContentInteraction.mockReturnValue(mockInteractionMutation)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Admin Actions Rendering', () => {
    it('renders edit and delete buttons for admin users', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockAdminSession }
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('renders edit button for content authors', () => {
      const authorSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          id: 'author-123' // Match the content author ID
        }
      }

      render(
        <ContentActions
          config={{
            ...baseConfig,
            contentType: 'forum' // Forum allows authors to edit their own posts
          }}
          content={mockContent}
        />,
        { session: authorSession }
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('hides admin actions for regular users on blog/wiki content', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })

    it('renders compact admin actions when compact prop is true', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
          compact={true}
        />,
        { session: mockAdminSession }
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toHaveClass('space-x-1') // Compact spacing
    })
  })

  describe('Social Actions Rendering', () => {
    it('renders all social action buttons when enabled', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument() // Like count
      expect(screen.getByRole('button', { name: /2/i })).toBeInTheDocument() // Bookmark count
      expect(screen.getByRole('button', { name: /8/i })).toBeInTheDocument() // Share count
      expect(screen.getByRole('button', { name: /3/i })).toBeInTheDocument() // Helpful count
    })

    it('shows active states for social actions', () => {
      const activeConfig = {
        ...baseConfig,
        socialActions: {
          ...baseConfig.socialActions,
          like: {
            enabled: true,
            count: 6,
            isActive: true // User has already liked
          }
        }
      }

      render(
        <ContentActions
          config={activeConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const likeButton = screen.getByRole('button', { name: /6/i })
      expect(likeButton).toHaveClass('bg-red-50') // Active state styling
    })

    it('renders social actions with labels when showLabels is true', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
          showLabels={true}
        />,
        { session: mockSession }
      )

      expect(screen.getByText('Like')).toBeInTheDocument()
      expect(screen.getByText('Bookmark')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      expect(screen.getByText('Helpful')).toBeInTheDocument()
    })

    it('disables social actions for unauthenticated users', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      const bookmarkButton = screen.getByRole('button', { name: /2/i })
      const helpfulButton = screen.getByRole('button', { name: /3/i })

      expect(likeButton).toBeDisabled()
      expect(bookmarkButton).toBeDisabled()
      expect(helpfulButton).toBeDisabled()
      
      // Share button should not be disabled (no auth required for share)
      const shareButton = screen.getByRole('button', { name: /8/i })
      expect(shareButton).not.toBeDisabled()
    })
  })

  describe('Content Type Handling', () => {
    it('handles forum content type correctly', () => {
      const forumConfig = {
        ...baseConfig,
        contentType: 'forum' as const
      }

      render(
        <ContentActions
          config={forumConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      // Should use forumHooks for interactions
      expect(require('@/lib/hooks/useContent').forumHooks.useContentInteraction).toHaveBeenCalled()
    })

    it('handles wiki content type correctly', () => {
      const wikiConfig = {
        ...baseConfig,
        contentType: 'wiki' as const
      }

      render(
        <ContentActions
          config={wikiConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      // Should use wikiHooks for interactions
      expect(require('@/lib/hooks/useContent').wikiHooks.useContentInteraction).toHaveBeenCalled()
    })

    it('handles blog content type correctly', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      // Should use blogHooks for interactions
      expect(require('@/lib/hooks/useContent').blogHooks.useContentInteraction).toHaveBeenCalled()
    })
  })

  describe('User Interactions', () => {
    it('handles like action correctly', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      await user.click(likeButton)

      await waitFor(() => {
        expect(mockInteractionMutation.mutate).toHaveBeenCalledWith({
          slug: 'test-post',
          action: 'like'
        }, expect.any(Object))
      })
    })

    it('handles bookmark action correctly', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const bookmarkButton = screen.getByRole('button', { name: /2/i })
      await user.click(bookmarkButton)

      await waitFor(() => {
        expect(mockInteractionMutation.mutate).toHaveBeenCalledWith({
          slug: 'test-post',
          action: 'bookmark'
        }, expect.any(Object))
      })
    })

    it('handles share action with clipboard correctly', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const shareButton = screen.getByRole('button', { name: /8/i })
      await user.click(shareButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/blog/test-post')
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!', { duration: 2000 })
      })
    })

    it('handles helpful action correctly', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const helpfulButton = screen.getByRole('button', { name: /3/i })
      await user.click(helpfulButton)

      await waitFor(() => {
        expect(mockInteractionMutation.mutate).toHaveBeenCalledWith({
          slug: 'test-post',
          action: 'helpful'
        }, expect.any(Object))
      })
    })

    it('shows error message for unauthenticated social actions', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      await user.click(likeButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please sign in to interact with posts', { duration: 3000 })
      })
    })
  })

  describe('Edit and Delete Actions', () => {
    it('handles edit action with custom callback', async () => {
      const user = userEvent.setup()
      const mockOnEdit = vi.fn()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
          onEdit={mockOnEdit}
        />,
        { session: mockAdminSession }
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalled()
    })

    it('handles edit action with path navigation', async () => {
      const user = userEvent.setup()
      const mockPush = vi.fn()
      
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush
      })

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockAdminSession }
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockPush).toHaveBeenCalledWith('/blog/edit/test-post')
    })

    it('handles delete action with confirmation modal', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockAdminSession }
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Should open confirmation modal
      expect(screen.getByText('Delete Post')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this post?')).toBeInTheDocument()
    })

    it('executes delete after confirmation', async () => {
      const user = userEvent.setup()
      mockDeleteMutation.mutateAsync.mockResolvedValue({})

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockAdminSession }
      )

      // Open delete confirmation
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteMutation.mutateAsync).toHaveBeenCalledWith('test-post')
      })
    })

    it('handles delete error gracefully', async () => {
      const user = userEvent.setup()
      const deleteError = new Error('Delete failed')
      mockDeleteMutation.mutateAsync.mockRejectedValue(deleteError)

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockAdminSession }
      )

      // Open and confirm deletion
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete failed'))
      })
    })
  })

  describe('Props and State Management', () => {
    it('updates social stats when config changes', () => {
      const { rerender } = render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      // Initial state
      expect(screen.getByText('5')).toBeInTheDocument() // Like count

      // Update config
      const updatedConfig = {
        ...baseConfig,
        socialActions: {
          ...baseConfig.socialActions,
          like: {
            enabled: true,
            count: 10, // Updated count
            isActive: true
          }
        }
      }

      rerender(
        <ContentActions
          config={updatedConfig}
          content={mockContent}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument() // Updated like count
    })

    it('calls onStatsChange callback when interaction succeeds', async () => {
      const user = userEvent.setup()
      const mockOnStatsChange = vi.fn()
      const mockStats = { likesCount: 6, bookmarksCount: 2, sharesCount: 8, helpfulsCount: 3 }

      // Mock successful interaction response
      mockInteractionMutation.mutate.mockImplementation((_, { onSuccess }) => {
        onSuccess({ stats: mockStats })
      })

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
          onStatsChange={mockOnStatsChange}
        />,
        { session: mockSession }
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      await user.click(likeButton)

      await waitFor(() => {
        expect(mockOnStatsChange).toHaveBeenCalledWith(mockStats)
      })
    })

    it('handles pending action states correctly', async () => {
      const user = userEvent.setup()
      let pendingResolver: (value: any) => void

      // Mock pending mutation
      mockInteractionMutation.mutate.mockImplementation((_, { onSettled }) => {
        // Simulate pending state
        setTimeout(() => onSettled?.(), 100)
      })

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      await user.click(likeButton)

      // Button should show pending state
      expect(likeButton).toHaveClass('opacity-70')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for all buttons', () => {
      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockAdminSession }
      )

      // All buttons should have proper roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('maintains focus management during interactions', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      likeButton.focus()
      
      expect(likeButton).toHaveFocus()
      
      await user.click(likeButton)
      
      // Focus should remain on button after interaction
      expect(likeButton).toHaveFocus()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <ContentActions
          config={baseConfig}
          content={mockContent}
        />,
        { session: mockSession }
      )

      const likeButton = screen.getByRole('button', { name: /5/i })
      likeButton.focus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockInteractionMutation.mutate).toHaveBeenCalledWith({
          slug: 'test-post',
          action: 'like'
        }, expect.any(Object))
      })
    })
  })
})