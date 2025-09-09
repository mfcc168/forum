'use client'

import { memo, useMemo } from 'react'
import { ContentForm } from '@/app/components/shared/ContentForm'
import { getDexFormConfig } from '@/lib/config/dex-form-config'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { useDexModels } from '@/lib/hooks/useDex'
import type { DexMonster } from '@/lib/types'
import type { DexModelOption } from '@/lib/utils/dex-models'

interface DexFormProps {
  monster?: DexMonster // If provided, we're editing; otherwise, creating
  onSuccess: (monsterSlug: string) => void
  onCancel: () => void
  initialModels?: DexModelOption[] // Server-side fetched models for SSR consistency
}

export const DexForm = memo(function DexForm({ monster, onSuccess, onCancel, initialModels }: DexFormProps) {
  const { t } = useTranslation()
  
  // Use server-side models when available, fallback to client-side fetch for backward compatibility
  const { data: clientModels, isLoading: modelsLoading } = useDexModels({
    enabled: !initialModels // Only fetch if no server-side models provided
  })
  
  // Get translated configuration with model options
  const config = useMemo(() => {
    const modelOptions = initialModels || clientModels || []
    return getDexFormConfig(t, modelOptions)
  }, [t, initialModels, clientModels])
  
  // No need to flatten data anymore - nested field paths handle the structure automatically
  
  // Don't render form until models are loaded (only when doing client-side fetch)
  if (!initialModels && modelsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-3 text-slate-600">Loading models...</span>
      </div>
    )
  }
  
  return (
    <ContentForm<DexMonster>
      config={config}
      item={monster}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
})