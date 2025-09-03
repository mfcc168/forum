/**
 * Wiki guide action controls for edit, delete, and social interactions.
 */
'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { ContentActions, type ContentActionsConfig } from '@/app/components/shared/ContentActions'
import { useDeleteWikiGuide } from '@/lib/hooks/useWiki'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { WikiGuide } from '@/lib/types'

interface WikiActionsProps {
  guide: WikiGuide
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  showLabels?: boolean
}

export function WikiActions({ 
  guide, 
  onEdit, 
  onDelete, 
  compact = false,
  showLabels = !compact
}: WikiActionsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const deleteWikiGuideMutation = useDeleteWikiGuide()
  const permissions = usePermissions(session, 'wiki', guide)

  const actionsConfig: ContentActionsConfig = useMemo(() => ({
    contentType: 'wiki',
    identifier: guide.slug,
    adminActions: permissions.canEdit ? {
      edit: {
        enabled: true,
        path: `/wiki/edit/${guide.slug}`
      },
      delete: permissions.canDelete ? {
        enabled: true,
        mutation: deleteWikiGuideMutation,
        confirmTitle: t.wiki?.actions?.confirmDeleteTitle || 'Confirm Delete',
        confirmMessage: t.wiki?.actions?.confirmDeleteMessage || 'Are you sure you want to delete this guide?'
      } : undefined
    } : undefined,
    socialActions: {
      like: {
        enabled: true,
        count: guide.stats?.likesCount || 0,
        isActive: guide.interactions?.isLiked || false
      },
      bookmark: {
        enabled: true,
        count: guide.stats?.bookmarksCount || 0,
        isActive: guide.interactions?.isBookmarked || false
      },
      share: {
        enabled: true,
        count: guide.stats?.sharesCount || 0,
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/wiki/${guide.slug}`
      },
      helpful: {
        enabled: true,
        count: guide.stats?.helpfulsCount || 0,
        isActive: guide.interactions?.isHelpful || false
      }
    }
  }), [guide.slug, guide.stats, guide.interactions, permissions.canEdit, permissions.canDelete, deleteWikiGuideMutation, t.wiki?.actions])

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