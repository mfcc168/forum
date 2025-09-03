/**
 * Blog post action controls for edit, delete, and social interactions.
 */
'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { ContentActions, type ContentActionsConfig } from '@/app/components/shared/ContentActions'
import { useDeleteBlogPost } from '@/lib/hooks/useBlog'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { BlogPost } from '@/lib/types'

interface BlogActionsProps {
  post: BlogPost
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  showLabels?: boolean
}

export function BlogActions({ 
  post,
  onEdit, 
  onDelete, 
  compact = false,
  showLabels = !compact
}: BlogActionsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const deleteBlogPostMutation = useDeleteBlogPost()
  const permissions = usePermissions(session, 'blog', post)

  const actionsConfig: ContentActionsConfig = useMemo(() => ({
    contentType: 'blog',
    identifier: post.slug,
    adminActions: permissions.canEdit ? {
      edit: {
        enabled: true,
        path: `/blog/edit/${post.slug}`
      },
      delete: permissions.canDelete ? {
        enabled: true,
        mutation: deleteBlogPostMutation,
        confirmTitle: t.blog?.actions?.confirmDeleteTitle || 'Confirm Delete',
        confirmMessage: t.blog?.actions?.confirmDeleteMessage || 'Are you sure you want to delete this post?'
      } : undefined
    } : undefined,
    socialActions: {
      like: {
        enabled: true,
        count: post.stats?.likesCount || 0,
        isActive: post.interactions?.isLiked || false
      },
      bookmark: {
        enabled: true,
        count: post.stats?.bookmarksCount || 0,
        isActive: post.interactions?.isBookmarked || false
      },
      share: {
        enabled: true,
        count: post.stats?.sharesCount || 0,
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${post.slug}`
      }
    }
  }), [post.slug, post.stats, post.interactions, permissions.canEdit, permissions.canDelete, deleteBlogPostMutation, t.blog?.actions])

  return (
    <ContentActions
      config={actionsConfig}
      onEdit={onEdit}
      onDelete={onDelete}
      compact={compact}
      showLabels={showLabels}
    />
  )
}