'use client'

import { memo, useMemo } from 'react'
import { ContentForm } from '@/app/components/shared/ContentForm'
import { getForumFormConfig } from '@/lib/config/forum-form-config'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import type { ForumPost } from '@/lib/types'

interface ForumFormProps {
  post?: ForumPost // If provided, we're editing; otherwise, creating
  onSuccess: (postSlug: string) => void // Fixed: Changed from postId to postSlug for consistency
  onCancel: () => void
}

export const ForumForm = memo(function ForumForm({ post, onSuccess, onCancel }: ForumFormProps) {
  const { t } = useTranslation()
  
  // Get translated configuration (same pattern as BlogForm)
  const config = useMemo(() => getForumFormConfig(t), [t])

  return (
    <ContentForm<ForumPost>
      config={config}
      item={post}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
})