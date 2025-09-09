'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { ReplyForm } from '@/app/components/forum/ReplyForm'
import { WysiwygEditor } from '@/app/components/ui/WysiwygEditor'
import { sanitizeHtml } from '@/lib/utils/html'
import { formatSimpleDate } from '@/lib/utils'
import { useReplies, useUpdateReply, useDeleteReply } from '@/lib/hooks/useReplies'
import type { ForumReply } from '@/lib/types'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { useConfirm } from '@/lib/hooks/useConfirm'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'
import { updateReplySchema } from '@/lib/schemas/forum'
import { ZodError } from 'zod'
import { ListRenderer } from '@/app/components/ui/StateRenderer'

interface ReplyListProps {
  initialReplies: ForumReply[]
  postId: string
  currentUserId?: string
  canReply?: boolean
  onReplyAdded?: () => void
}

export const ReplyList = memo(function ReplyList({ 
  initialReplies, 
  postId, 
  currentUserId, 
  canReply = false 
}: ReplyListProps) {
  // Ensure initialReplies is always an array
  const safeInitialReplies = Array.isArray(initialReplies) ? initialReplies : []
  
  const { data: session } = useSession()
  
  // Use React Query hook with direct state access
  const repliesQuery = useReplies(postId, safeInitialReplies)
  const rawReplies = repliesQuery.data || safeInitialReplies
  const { t } = useTranslation()
  const updateReplyMutation = useUpdateReply(postId)
  const deleteReplyMutation = useDeleteReply(postId)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editError, setEditError] = useState('')

  // Get general permissions (for admins who can edit any reply)
  const generalPermissions = usePermissions(session, 'forum')
  
  // Memoize permission check function using centralized system
  const canEditReply = useCallback((reply: ForumReply) => {
    // Admin/moderator can edit any reply
    if (generalPermissions.isAdmin || generalPermissions.isModerator) {
      return true
    }
    // Users can only edit their own replies
    const replyAuthorId = typeof reply.author === 'object' ? reply.author?.id : reply.author
    return replyAuthorId === currentUserId
  }, [generalPermissions.isAdmin, generalPermissions.isModerator, currentUserId])


  const handleEditReply = useCallback((reply: ForumReply) => {
    setEditingReply(reply.id)
    setEditContent(reply.content)
    setEditError('')
  }, [])

  const handleSaveEdit = useCallback(async (replyId: string) => {
    setEditError('')

    try {
      // Validate with Zod before submission
      const validatedData = updateReplySchema.parse({ content: editContent })
      
      await updateReplyMutation.mutateAsync({ 
        replyId, 
        data: validatedData
      })
      setEditingReply(null)
      setEditContent('')
      setEditError('')
    } catch (error) {
      if (error instanceof ZodError) {
        // Show the first validation error
        const firstError = error.errors[0]
        setEditError(firstError.message)
      } else {
        // Error already handled by mutation for other types
        setEditError(error instanceof Error ? error.message : 'Failed to update reply')
      }
    }
  }, [editContent, updateReplyMutation])

  const handleDeleteReply = useCallback(async (replyId: string) => {
    const confirmed = await confirm({
      title: t.common.confirmations.deleteReply.title,
      message: t.common.confirmations.deleteReply.message,
      confirmText: t.common.confirmations.deleteReply.confirm,
      cancelText: t.common.confirmations.deleteReply.cancel,
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteReplyMutation.mutateAsync(replyId)
    } catch {
      // Error already handled by mutation
    }
  }, [confirm, deleteReplyMutation, t.common.confirmations.deleteReply])

  const handleReplySuccess = useCallback(() => {
    setReplyingTo(null)
    // Reply is automatically added to list via React Query cache invalidation
  }, [])

  // Memoize expensive reply grouping calculations
  const { topLevelReplies, nestedReplies } = useMemo(() => {
    // Ensure replies is always an array to prevent filter errors
    const replies = Array.isArray(rawReplies) ? rawReplies : []
    return {
      topLevelReplies: replies.filter(reply => !reply.replyToId),
      nestedReplies: replies.filter(reply => reply.replyToId)
    }
  }, [rawReplies])

  const getRepliesFor = useCallback((parentId: string) => {
    return nestedReplies.filter(reply => reply.replyToId === parentId)
  }, [nestedReplies])

  const renderReply = useCallback((reply: ForumReply, isNested = false) => (
    <div className={`${isNested ? 'ml-8 mt-4' : ''}`}>
      <Card className="p-4 bg-slate-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              {reply.author?.avatar ? (
                <Image 
                  src={reply.author.avatar!} 
                  alt={reply.author?.name || 'Unknown User'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    // Hide the broken image and show fallback
                    const img = e.target as HTMLImageElement;
                    const fallback = img.nextElementSibling as HTMLElement;
                    img.style.display = 'none';
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold ${reply.author?.avatar ? 'hidden' : ''}`}
              >
                {(reply.author?.name || 'Unknown User').charAt(0).toUpperCase()}
              </div>
              <strong className="text-slate-800">{reply.author?.name || 'Unknown User'}</strong>
            </div>
            <span>{formatSimpleDate(reply.createdAt || new Date().toISOString())}</span>
            {reply.createdAt && reply.updatedAt && reply.createdAt !== reply.updatedAt && (
              <span className="text-xs">(edited)</span>
            )}
          </div>

          {canEditReply(reply) && (
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditReply(reply)}
                className="text-xs"
              >
{t.forum.postDetail.replyActions.edit}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteReply(reply.id)}
                className="text-xs text-red-600 hover:text-red-700"
              >
{t.forum.postDetail.replyActions.delete}
              </Button>
            </div>
          )}
        </div>

        {editingReply === reply.id ? (
          <div className="space-y-3">
            {editError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {editError}
              </div>
            )}
            <WysiwygEditor
              content={editContent}
              onChange={setEditContent}
              placeholder={t.forum.postDetail.replyActions.editPlaceholder}
              className="min-h-[120px]"
            />
            <div className="flex space-x-2">
              <Button
                onClick={() => handleSaveEdit(reply.id)}
                disabled={updateReplyMutation.isPending}
                size="sm"
              >
                {updateReplyMutation.isPending ? t.forum.postDetail.replyActions.saving : t.forum.postDetail.replyActions.save}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingReply(null)
                  setEditContent('')
                }}
                disabled={updateReplyMutation.isPending}
                size="sm"
              >
{t.forum.postDetail.replyActions.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div 
              className="text-slate-700 mb-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(reply.content || '') }}
            />

            {canReply && !isNested && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                  className="text-xs"
                >
{t.forum.postDetail.replyActions.reply}
                </Button>
                {(reply.stats.likesCount || 0) > 0 && (
                  <span className="text-xs text-slate-500">
                    👍 {reply.stats.likesCount || 0}
                  </span>
                )}
              </div>
            )}

            {replyingTo === reply.id && (
              <div className="mt-4">
                <ReplyForm
                  postId={postId}
                  replyToId={reply.id}
                  replyToAuthor={(typeof reply.author === 'object' ? reply.author.name : reply.author) || 'Unknown User'}
                  onSuccess={handleReplySuccess}
                  onCancel={() => setReplyingTo(null)}
                  placeholder={`Reply to ${(typeof reply.author === 'object' ? reply.author.name : reply.author) || 'Unknown User'}...`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Nested replies */}
      {!isNested && getRepliesFor(reply.id).map((nestedReply, index) => (
        <div key={nestedReply.id || `nested-${reply.id}-${index}`}>
          {renderReply(nestedReply, true)}
        </div>
      ))}
    </div>
  ), [editingReply, editContent, editError, updateReplyMutation, canEditReply, handleEditReply, handleSaveEdit, handleDeleteReply, replyingTo, handleReplySuccess, postId, getRepliesFor, t, canReply])

  return (
    <>
      <ListRenderer
        state={{
          data: topLevelReplies,
          isLoading: repliesQuery.isLoading && !repliesQuery.data && safeInitialReplies.length === 0,
          error: repliesQuery.error,
          refetch: repliesQuery.refetch
        }}
        loading={{
          variant: 'skeleton',
          layout: 'list',
          count: 2,
          message: 'Loading replies...'
        }}
        error={{
          variant: 'card',
          onRetry: repliesQuery.refetch,
          showReload: true
        }}
        empty={{
          title: t.forum.postDetail.noReplies.title,
          description: t.forum.postDetail.noReplies.subtitle,
          icon: 'messageCircle',
          variant: 'card'
        }}
      >
        <div className="space-y-4">
          {topLevelReplies.map((reply, index) => (
            <div key={reply.id || `reply-${index}`}>
              {renderReply(reply)}
            </div>
          ))}
        </div>
      </ListRenderer>
      
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </>
  )
})