'use client'

import { memo, useMemo } from 'react'
import { ContentForm } from '@/app/components/shared/ContentForm'
import { getBlogFormConfig } from '@/lib/config/blog-form-config'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import type { BlogPost } from '@/lib/types'

interface BlogFormProps {
  post?: BlogPost // If provided, we're editing; otherwise, creating
  onSuccess: (postSlug: string) => void
  onCancel: () => void
}

export const BlogForm = memo(function BlogForm({ post, onSuccess, onCancel }: BlogFormProps) {
  const { t } = useTranslation()
  
  // Get translated configuration
  const config = useMemo(() => getBlogFormConfig(t), [t])
  
  return (
    <ContentForm<BlogPost>
      config={config}
      item={post}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
})