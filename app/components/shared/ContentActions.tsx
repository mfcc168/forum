/**
 * Unified action component for content edit, delete, and social interactions.
 * Supports all content types (blog, forum, wiki) with consistent behavior.
 */
'use client'

import { useState, useCallback, memo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Button } from '@/app/components/ui/Button'
import { Icon } from '@/app/components/ui/Icon'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'
import { handleMutationError } from '@/lib/utils/errors'
import type { ContentStats, ContentModule } from '@/lib/types'
import type { UseMutationResult } from '@tanstack/react-query'
import { forumHooks, blogHooks, wikiHooks } from '@/lib/hooks/useContent'
import { useDexMonsterInteraction } from '@/lib/hooks/useDex'

type ContentMutation = UseMutationResult<unknown, Error, unknown>
type DeleteMutation = UseMutationResult<unknown, Error, string>

export interface ContentActionsConfig {
  /** Type of content (blog/forum/wiki) */
  contentType: ContentModule
  /** Content identifier (slug for blog/wiki, id for forum) */
  identifier: string
  /** Admin-only actions */
  adminActions?: {
    edit?: {
      enabled: boolean
      path: string
      mutation?: ContentMutation
    }
    delete?: {
      enabled: boolean
      mutation: DeleteMutation
      confirmTitle: string
      confirmMessage: string
    }
  }
  /** Social actions for all content types */
  socialActions?: {
    like?: {
      enabled: boolean
      count: number
      isActive: boolean
    }
    bookmark?: {
      enabled: boolean
      count: number
      isActive: boolean
    }
    share?: {
      enabled: boolean
      count: number
      url: string
    }
    helpful?: {
      enabled: boolean
      count: number
      isActive: boolean
    }
  }
}

interface ContentActionsProps {
  config: ContentActionsConfig
  /** Content item for permission checking (requires author info for edit/delete permissions) */
  content?: {
    id?: string
    slug?: string
    author?: {
      id: string
      name?: string
      avatar?: string
    }
  }
  onEdit?: () => void
  onDelete?: () => void
  onStatsChange?: (stats: ContentStats) => void
  compact?: boolean
  showLabels?: boolean
}

export const ContentActions = memo(function ContentActions({
  config,
  content,
  onEdit,
  onDelete,
  onStatsChange,
  compact = false,
  showLabels = false
}: ContentActionsProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [socialStats, setSocialStats] = useState(config.socialActions)
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set())
  
  // Update local state when props change (from React Query cache updates)
  useEffect(() => {
    if (config.socialActions) {
      setSocialStats(config.socialActions)
    }
  }, [config.socialActions])

  // Use centralized permission system
  const permissions = usePermissions(session, config.contentType, content)
  const isAuthenticated = !!session

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit()
    } else if (config.adminActions?.edit?.path) {
      router.push(config.adminActions.edit.path)
    }
  }, [onEdit, router, config.adminActions?.edit?.path])

  const handleDelete = useCallback(async () => {
    if (!config.adminActions?.delete?.mutation) return
    
    try {
      await config.adminActions.delete.mutation.mutateAsync(config.identifier)
      setShowDeleteConfirm(false)
      if (onDelete) {
        onDelete()
      } else {
        const backPath = config.contentType === 'blog' ? '/blog' : '/forum'
        router.push(backPath)
      }
    } catch (error) {
      const message = handleMutationError(error, 'delete', config.contentType)
      toast.error(message)
    }
  }, [config, onDelete, router])

  // Get the appropriate React Query hook for this content type
  const getInteractionHook = () => {
    switch (config.contentType) {
      case 'forum':
        return forumHooks.useContentInteraction()
      case 'blog':
        return blogHooks.useContentInteraction()
      case 'wiki':
        return wikiHooks.useContentInteraction()
      case 'dex':
        return useDexMonsterInteraction()
      default:
        throw new Error(`Unsupported content type: ${config.contentType}`)
    }
  }

  const interactionMutation = getInteractionHook()

  const handleSocialAction = useCallback(async (action: 'like' | 'bookmark' | 'share' | 'helpful') => {
    if (!isAuthenticated) {
      toast.error('Please sign in to interact with posts', { duration: 3000 })
      return
    }

    // Add to pending actions for immediate feedback
    setPendingActions(prev => new Set(prev).add(action))


    // Handle special share action with clipboard
    if (action === 'share' && socialStats?.share?.url) {
      try {
        await navigator.clipboard.writeText(socialStats.share.url)
        toast.success('Link copied to clipboard!', { duration: 2000 })
        
        // Still trigger the share count API call in background
        interactionMutation.mutate({ 
          slug: config.identifier, 
          action: 'share' 
        }, {
          onSettled: () => {
            setPendingActions(prev => {
              const next = new Set(prev)
              next.delete(action)
              return next
            })
          }
        })
        return
      } catch {
        // Fallback to API call only if clipboard fails
      }
    }

    // Use simplified React Query mutation
    interactionMutation.mutate({ 
      slug: config.identifier, 
      action 
    }, {
      onSuccess: (data) => {
        onStatsChange?.(data.stats)
      },
      onSettled: () => {
        // Remove from pending actions
        setPendingActions(prev => {
          const next = new Set(prev)
          next.delete(action)
          return next
        })
      }
    })
  }, [isAuthenticated, interactionMutation, config.identifier, socialStats, onStatsChange])

  const renderAdminActions = () => {
    if (!config.adminActions) return null

    const canEdit = permissions.canEdit && config.adminActions.edit?.enabled
    const canDelete = permissions.canDelete && config.adminActions.delete?.enabled

    if (!canEdit && !canDelete) return null

    return (
      <>
        {canEdit && (
          <Button
            variant="outline"
            size={compact ? "sm" : "md"}
            onClick={handleEdit}
            className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'}`}
          >
            <Icon name="edit" className="w-4 h-4" />
            {!compact && <span>{t[config.contentType].actions.edit}</span>}
          </Button>
        )}
        
        {canDelete && (
          <Button
            variant="outline"
            size={compact ? "sm" : "md"}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={config.adminActions.delete?.mutation?.isPending}
            className={`flex items-center text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 ${compact ? 'space-x-1' : 'space-x-2'}`}
          >
            <Icon name="trash" className="w-4 h-4" />
            {!compact && (
              <span>
                {config.adminActions.delete?.mutation?.isPending 
                  ? t[config.contentType].actions.deleting 
                  : t[config.contentType].actions.delete}
              </span>
            )}
          </Button>
        )}
      </>
    )
  }

  const renderSocialActions = () => {
    if (!socialStats) return null

    return (
      <>
        {socialStats.like?.enabled && (
          <Button
            variant="outline"
            size={compact ? "sm" : "md"}
            onClick={() => handleSocialAction('like')}
            disabled={!isAuthenticated} // Only disable if not authenticated
            className={`flex items-center space-x-1 transition-all duration-150 ease-out text-red-500 ${
              socialStats.like.isActive ? 'border-red-200 bg-red-50 hover:bg-red-100' : 'border-red-100 hover:border-red-200 hover:bg-red-50'
            } hover:shadow-sm active:scale-95 cursor-pointer ${
              pendingActions.has('like') ? 'opacity-70' : ''
            }`}
          >
            <Icon 
              name="heart" 
              className={`w-4 h-4 transition-all duration-150 text-red-500 ${
                socialStats.like.isActive ? 'fill-current scale-110' : 'hover:scale-105'
              }`} 
            />
            <span className="min-w-[1ch] font-medium transition-all duration-150">
              {socialStats.like.count}
            </span>
            {showLabels && <span>{t[config.contentType]?.actions?.like || 'Like'}</span>}
          </Button>
        )}

        {socialStats.bookmark?.enabled && (
          <Button
            variant="outline"
            size={compact ? "sm" : "md"}
            onClick={() => handleSocialAction('bookmark')}
            disabled={!isAuthenticated} // Only disable if not authenticated
            className={`flex items-center space-x-1 transition-all duration-150 ease-out text-emerald-500 ${
              socialStats.bookmark.isActive ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50'
            } hover:shadow-sm active:scale-95 cursor-pointer ${
              pendingActions.has('bookmark') ? 'opacity-70' : ''
            }`}
          >
            <Icon 
              name="bookmark" 
              className={`w-4 h-4 transition-all duration-150 text-emerald-500 ${
                socialStats.bookmark.isActive ? 'fill-current scale-110' : 'hover:scale-105'
              }`} 
            />
            <span className="min-w-[1ch] font-medium transition-all duration-150">
              {socialStats.bookmark.count}
            </span>
            {showLabels && <span>{t[config.contentType]?.actions?.bookmark || 'Bookmark'}</span>}
          </Button>
        )}

        {socialStats.share?.enabled && (
          <Button
            variant="outline"
            size={compact ? "sm" : "md"}
            onClick={() => handleSocialAction('share')}
            className={`flex items-center space-x-1 transition-all duration-150 ease-out text-blue-500 border-blue-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm active:scale-95 cursor-pointer ${
              pendingActions.has('share') ? 'opacity-70' : ''
            }`}
          >
            <Icon 
              name="share" 
              className="w-4 h-4 transition-all duration-150 text-blue-500 hover:scale-105" 
            />
            <span className="min-w-[1ch] font-medium transition-all duration-150">
              {socialStats.share.count}
            </span>
            {showLabels && <span>{t[config.contentType]?.actions?.share || 'Share'}</span>}
          </Button>
        )}

        {socialStats.helpful?.enabled && (
          <Button
            variant="outline"
            size={compact ? "sm" : "md"}
            onClick={() => handleSocialAction('helpful')}
            disabled={!isAuthenticated} // Only disable if not authenticated
            className={`flex items-center space-x-1 transition-all duration-150 ease-out text-amber-500 ${
              socialStats.helpful.isActive ? 'border-amber-200 bg-amber-50 hover:bg-amber-100' : 'border-amber-100 hover:border-amber-200 hover:bg-amber-50'
            } hover:shadow-sm active:scale-95 cursor-pointer ${
              pendingActions.has('helpful') ? 'opacity-70' : ''
            }`}
          >
            <Icon 
              name="thumbsUp" 
              className={`w-4 h-4 transition-all duration-150 text-amber-500 ${
                socialStats.helpful.isActive ? 'fill-current scale-110' : 'hover:scale-105'
              }`} 
            />
            <span className="min-w-[1ch] font-medium transition-all duration-150">
              {socialStats.helpful.count}
            </span>
            {showLabels && <span>{t.wiki?.actions?.helpful || 'Helpful'}</span>}
          </Button>
        )}
      </>
    )
  }

  return (
    <>
      <div className={`flex items-center ${compact ? 'space-x-2' : 'space-x-3'}`}>
        {renderAdminActions()}
        {renderSocialActions()}
      </div>

      {/* Delete Confirmation Modal */}
      {config.adminActions?.delete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title={config.adminActions.delete.confirmTitle}
          message={config.adminActions.delete.confirmMessage}
          confirmText={t[config.contentType].actions.delete}
          cancelText={t.common.cancel}
          variant="danger"
        />
      )}
    </>
  )
})