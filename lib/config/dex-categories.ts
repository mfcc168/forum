/**
 * Centralized Dex Categories Configuration
 * 
 * This file defines all dex/monster categories used throughout the application.
 * Update this file when adding/removing/reordering categories.
 * 
 * Order reflects usage frequency and importance:
 * - Most frequently used categories first
 * - Important monster types prioritized
 * - Alphabetical for similar importance
 */

import type { TranslationObject } from '@/lib/translations/locales/en'

export interface DexCategoryConfig {
  id: string
  translationKey: string
  description: string
  color: {
    bg: string
    text: string
  }
  order: number
}

export const DEX_CATEGORIES: DexCategoryConfig[] = [
  {
    id: 'common',
    translationKey: 'common',
    description: 'Common monsters found throughout the world',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800'
    },
    order: 1
  },
  {
    id: 'elite',
    translationKey: 'elite',
    description: 'Elite monsters with enhanced abilities',
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-800'
    },
    order: 2
  },
  {
    id: 'boss',
    translationKey: 'boss',
    description: 'Powerful boss monsters',
    color: {
      bg: 'bg-red-100',
      text: 'text-red-800'
    },
    order: 3
  },
  {
    id: 'rare',
    translationKey: 'rare',
    description: 'Rare and unique monsters',
    color: {
      bg: 'bg-purple-100',
      text: 'text-purple-800'
    },
    order: 4
  },
  {
    id: 'legendary',
    translationKey: 'legendary',
    description: 'Legendary creatures of immense power',
    color: {
      bg: 'bg-amber-100',
      text: 'text-amber-800'
    },
    order: 5
  },
  {
    id: 'npc',
    translationKey: 'npc',
    description: 'Non-player characters and friendly entities',
    color: {
      bg: 'bg-cyan-100',
      text: 'text-cyan-800'
    },
    order: 6
  }
]

// Helper functions for easy access
export const getDexCategory = (id: string): DexCategoryConfig | undefined => {
  return DEX_CATEGORIES.find(cat => cat.id === id)
}

export const getDexCategoryIds = (): string[] => {
  return DEX_CATEGORIES.map(cat => cat.id)
}

// Original function for backward compatibility
export const getDexCategoriesForForm = (): Array<{ value: string; label: string; disabled?: boolean }> => {
  return DEX_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.id,
      label: category.translationKey.charAt(0).toUpperCase() + category.translationKey.slice(1),
      disabled: false
    }))
}

// New translation-aware function
export const getDexCategoriesForFormWithTranslation = (t: TranslationObject): Array<{ value: string; label: string; disabled?: boolean }> => {
  return DEX_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.id,
      label: t.dex.categoryNames[category.translationKey as keyof typeof t.dex.categoryNames] || category.translationKey.charAt(0).toUpperCase() + category.translationKey.slice(1),
      disabled: false
    }))
}

export const getDexCategoryColor = (categoryId: string): { bg: string; text: string } => {
  const category = getDexCategory(categoryId)
  return category?.color || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const getDefaultDexCategory = (): string => {
  return DEX_CATEGORIES[0].id // Returns the first (most commonly used) category
}