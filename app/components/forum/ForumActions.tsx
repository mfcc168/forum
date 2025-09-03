/**
 * Forum post action controls for edit, delete, and social interactions.
 */
'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { ContentActions, type ContentActionsConfig } from '@/app/components/shared/ContentActions'
import { useDeleteForumPost } from '@/lib/hooks/useForum'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { ForumPost } from '@/lib/types'

interface ForumActionsProps {
  post: ForumPost
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  showLabels?: boolean
}

export function ForumActions({
  post,
  onEdit,
  onDelete,
  compact = false,
  showLabels = !compact
}: ForumActionsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const deleteForumPostMutation = useDeleteForumPost()
  const permissions = usePermissions(session, 'forum', post)

  const actionsConfig: ContentActionsConfig = useMemo(() => ({
    contentType: 'forum',
    identifier: post.slug,
    adminActions: permissions.canEdit ? {
      edit: {
        enabled: true,
        path: `/forum/edit/${post.slug}`
      },
      delete: permissions.canDelete ? {
        enabled: true,
        mutation: deleteForumPostMutation,
        confirmTitle: t.forum?.actions?.confirmDeleteTitle || 'Confirm Delete',
        confirmMessage: t.forum?.actions?.confirmDeleteMessage || 'Are you sure you want to delete this post?'
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
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/forum/${post.slug}`
      }
    }
  }), [post.slug, post.stats, post.interactions, permissions.canEdit, permissions.canDelete, deleteForumPostMutation, t.forum?.actions])

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