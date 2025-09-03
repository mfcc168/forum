/**
 * Centralized Wiki Categories Configuration
 * 
 * This file defines all wiki categories used throughout the application.
 * Update this file when adding/removing/reordering categories.
 * 
 * Order reflects typical learning progression:
 * - Beginner topics first
 * - Building and gameplay mechanics
 * - Advanced topics last
 */

import type { TranslationObject } from '@/lib/translations/locales/en'

export interface WikiCategoryConfig {
  id: string
  translationKey: string
  description: string
  color: {
    bg: string
    text: string
  }
  order: number
}

export const WIKI_CATEGORIES: WikiCategoryConfig[] = [
  {
    id: 'getting-started',
    translationKey: 'getting-started',
    description: 'New player guides and basics',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800'
    },
    order: 1
  },
  {
    id: 'building',
    translationKey: 'building',
    description: 'Building techniques and tutorials',
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-800'
    },
    order: 2
  },
  {
    id: 'mechanics',
    translationKey: 'mechanics',
    description: 'Game mechanics and redstone',
    color: {
      bg: 'bg-red-100',
      text: 'text-red-800'
    },
    order: 3
  },
  {
    id: 'farming',
    translationKey: 'farming',
    description: 'Farming and resource gathering',
    color: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800'
    },
    order: 4
  },
  {
    id: 'combat',
    translationKey: 'combat',
    description: 'Combat strategies and PvP',
    color: {
      bg: 'bg-orange-100',
      text: 'text-orange-800'
    },
    order: 5
  },
  {
    id: 'general',
    translationKey: 'general',
    description: 'General guides and tips',
    color: {
      bg: 'bg-slate-100',
      text: 'text-slate-800'
    },
    order: 6
  }
]

// Helper functions for easy access (consistent with blog-categories)
export const getWikiCategory = (id: string): WikiCategoryConfig | undefined => {
  return WIKI_CATEGORIES.find(cat => cat.id === id)
}

export const getWikiCategoryIds = (): string[] => {
  return WIKI_CATEGORIES.map(cat => cat.id)
}

// Original function for backward compatibility
export const getWikiCategoriesForForm = (): Array<{ value: string; label: string; disabled?: boolean }> => {
  return WIKI_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.id,
      label: category.translationKey.charAt(0).toUpperCase() + category.translationKey.slice(1),
      disabled: false
    }))
}

// New translation-aware function
export const getWikiCategoriesForFormWithTranslation = (t: TranslationObject): Array<{ value: string; label: string; disabled?: boolean }> => {
  return WIKI_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.id,
      label: t.wiki.categories[category.translationKey as keyof typeof t.wiki.categories] || category.translationKey.charAt(0).toUpperCase() + category.translationKey.slice(1),
      disabled: false
    }))
}

export const getWikiCategoryColor = (categoryId: string): { bg: string; text: string } => {
  const category = getWikiCategory(categoryId)
  return category?.color || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const getDefaultWikiCategory = (): string => {
  return WIKI_CATEGORIES[0].id // Returns the first (most commonly used) category
}