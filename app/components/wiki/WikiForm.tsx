'use client'

import { memo, useMemo } from 'react'
import { ContentForm } from '@/app/components/shared/ContentForm'
import { getWikiFormConfig } from '@/lib/config/wiki-form-config'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import type { WikiGuide } from '@/lib/types'

interface WikiFormProps {
  guide?: WikiGuide // If provided, we're editing; otherwise, creating
  onSuccess: (guideSlug: string) => void
  onCancel: () => void
}

export const WikiForm = memo(function WikiForm({ guide, onSuccess, onCancel }: WikiFormProps) {
  const { t } = useTranslation()
  
  // Get translated configuration
  const config = useMemo(() => getWikiFormConfig(t), [t])
  
  
  return (
    <ContentForm<WikiGuide>
      config={config}
      item={guide}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
})