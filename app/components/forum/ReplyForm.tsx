'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { WysiwygEditor } from '@/app/components/ui/WysiwygEditor'
import { useCreateReply } from '@/lib/hooks/useReplies'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { z } from 'zod'
import { ZodError } from 'zod'

// Frontend validation schema that doesn't validate postId format
const frontendReplySchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Reply content must be less than 5000 characters')
    .refine(
      (content) => {
        const textContent = content.replace(/<[^>]*>/g, '').trim()
        return textContent.length > 0
      },
      { message: 'Reply must contain text, not just HTML tags' }
    ),
  postId: z.string().min(1, 'Post ID is required'), // Accept any non-empty string
  replyToId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid reply ID format')
    .optional(),
})
interface ReplyFormProps {
  postId: string
  replyToId?: string
  replyToAuthor?: string
  onSuccess: (data?: unknown) => void
  onCancel: () => void
  placeholder?: string
}

export const ReplyForm = memo(function ReplyForm({ 
  postId, 
  replyToId, 
  replyToAuthor, 
  onSuccess, 
  onCancel,
  placeholder
}: ReplyFormProps) {
  const { data: session } = useSession()
  const createReplyMutation = useCreateReply(postId)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const { t } = useTranslation()
  
  // Memoize placeholder calculation to prevent re-renders
  const placeholderText = useMemo(() => {
    if (placeholder) return placeholder
    if (replyToAuthor) {
      return t.forum.forms.replyForm.replyToPlaceholder.replace('{username}', replyToAuthor)
    }
    return t.forum.forms.replyForm.placeholder
  }, [placeholder, replyToAuthor, t.forum.forms.replyForm.replyToPlaceholder, t.forum.forms.replyForm.placeholder])

  // Memoize reply data calculation
  const replyData = useMemo(() => ({
    content: content,
    postId: postId,
    replyToId: replyToId || undefined
  }), [content, postId, replyToId])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      setError(t.forum.forms.replyForm.loginRequired)
      return
    }

    setError('')

    try {
      // Validate with frontend schema (allows slug for postId)
      const validatedData = frontendReplySchema.parse(replyData)
      
      const reply = await createReplyMutation.mutateAsync({
        content: validatedData.content,
        postId: validatedData.postId,
        replyToId: validatedData.replyToId
      })
      
      // Clear form immediately for better UX
      setContent('')
      setError('')
      onSuccess?.(reply)
    } catch (error) {
      if (error instanceof ZodError) {
        // Show the first validation error
        const firstError = error.errors[0]
        setError(firstError.message)
      } else {
        setError(error instanceof Error ? error.message : 'Failed to post reply')
      }
    }
  }, [session, replyData, createReplyMutation, onSuccess, t.forum.forms.replyForm.loginRequired])

  if (!session) {
    return (
      <Card className="p-4 text-center bg-slate-50">
        <p className="text-slate-600">{t.forum.forms.replyForm.loginRequired}</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      {replyToAuthor && (
        <div className="mb-3 text-sm text-slate-600">
          {t.forum.forms.replyForm.replyingTo.split('{username}')[0]}
          <strong>{replyToAuthor}</strong>
          {t.forum.forms.replyForm.replyingTo.split('{username}')[1]}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <WysiwygEditor
            content={content}
            onChange={setContent}
            placeholder={placeholderText}
            className="min-h-[150px]"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            type="submit"
            disabled={createReplyMutation.isPending}
            size="sm"
          >
            {createReplyMutation.isPending ? t.forum.forms.replyForm.submitting : t.forum.forms.replyForm.submitButton}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createReplyMutation.isPending}
              size="sm"
            >
{t.forum.forms.replyForm.cancel}
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
})