'use client'

import { memo, useMemo } from 'react'
import { ContentForm } from '@/app/components/shared/ContentForm'
import { getDexFormConfig } from '@/lib/config/dex-form-config'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { useDexModels } from '@/lib/hooks/useDex'
import type { DexMonster } from '@/lib/types'

interface DexFormProps {
  monster?: DexMonster // If provided, we're editing; otherwise, creating
  onSuccess: (monsterSlug: string) => void
  onCancel: () => void
}

export const DexForm = memo(function DexForm({ monster, onSuccess, onCancel }: DexFormProps) {
  const { t } = useTranslation()
  
  // Fetch available models for the form
  const { data: models, isLoading: modelsLoading } = useDexModels()
  
  // Get translated configuration with model options
  const config = useMemo(() => {
    const modelOptions = models || []
    return getDexFormConfig(t, modelOptions)
  }, [t, models])
  
  // Flatten monster data for editing to match form field structure
  const initialData = useMemo(() => {
    if (!monster) return undefined
    
    const formData = {
      name: monster.name || '',
      description: monster.description || '',
      excerpt: monster.excerpt || '',
      category: monster.category || 'hostile',
      element: monster.element || 'none',
      race: monster.race || 'beast',
      modelPath: monster.modelPath || '',
      behaviors: monster.behaviors || [],
      health: monster.stats?.health?.toString() || '20',
      damage: monster.stats?.damage?.toString() || '5',
      xpDrop: monster.stats?.xpDrop?.toString() || '5',
      worlds: monster.spawning?.worlds || [],
      biomes: monster.spawning?.biomes || [],
      structures: monster.spawning?.structures || [],
      lightLevelMin: monster.spawning?.lightLevel?.min?.toString() || '0',
      lightLevelMax: monster.spawning?.lightLevel?.max?.toString() || '15',
      timeOfDay: monster.spawning?.timeOfDay || 'any',
      spawnRate: monster.spawning?.spawnRate || 'common',
      tags: monster.tags || [],
      status: monster.status || 'published'
    }
    
    return formData
  }, [monster])
  
  // Don't render form until models are loaded (to prevent form flickering)
  if (modelsLoading) {
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
      initialData={initialData}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
})