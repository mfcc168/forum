/**
 * Dex monster action controls for edit, delete, and social interactions.
 */
'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { ContentActions, type ContentActionsConfig } from '@/app/components/shared/ContentActions'
import { useDeleteDexMonster } from '@/lib/hooks/useDex'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { DexMonster } from '@/lib/types'

interface DexActionsProps {
  monster: DexMonster
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  showLabels?: boolean
}

export function DexActions({ 
  monster, 
  onEdit, 
  onDelete, 
  compact = false,
  showLabels = !compact
}: DexActionsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const deleteMonsterMutation = useDeleteDexMonster()
  const permissions = usePermissions(session, 'dex', monster)

  const actionsConfig: ContentActionsConfig = useMemo(() => ({
    contentType: 'dex',
    identifier: monster.slug,
    adminActions: permissions.canEdit ? {
      edit: {
        enabled: true,
        path: `/dex/edit/${monster.slug}`
      },
      delete: permissions.canDelete ? {
        enabled: true,
        mutation: deleteMonsterMutation,
        confirmTitle: t.dex?.actions?.confirmDeleteTitle || 'Confirm Delete',
        confirmMessage: t.dex?.actions?.confirmDeleteMessage || 'Are you sure you want to delete this monster?'
      } : undefined
    } : undefined,
    socialActions: {
      like: {
        enabled: false,
        count: monster.stats?.likesCount || 0,
        isActive: monster.interactions?.isLiked || false
      },
      bookmark: {
        enabled: false,
        count: monster.stats?.bookmarksCount || 0,
        isActive: monster.interactions?.isBookmarked || false
      },
      share: {
        enabled: true,
        count: monster.stats?.sharesCount || 0,
        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/dex/${monster.slug}`
      },
      favorite: {
        enabled: true,
        count: monster.stats?.favoritesCount || 0,
        isActive: monster.interactions?.isFavorited || false
      }
    }
  }), [monster.slug, monster.stats, monster.interactions, permissions.canEdit, permissions.canDelete, deleteMonsterMutation, t.dex?.actions])

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