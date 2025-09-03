/**
 * Centralized Forum Categories Configuration
 * 
 * This file defines all forum categories used throughout the application.
 * Update this file when adding/removing/reordering categories.
 * 
 * Order reflects logical flow and importance:
 * - General discussion first (most common)
 * - Server-related categories
 * - Community features
 * - Specialized topics
 */

import type { TranslationObject } from '@/lib/translations/locales/en'

export interface ForumCategoryConfig {
  id: string
  name: string
  translationKey: string
  description: string
  color: {
    bg: string
    text: string
    border: string
  }
  order: number
}

export const FORUM_CATEGORIES: ForumCategoryConfig[] = [
  {
    id: 'general',
    name: 'General Discussion',
    translationKey: 'General Discussion',
    description: 'General discussions about the server and Minecraft',
    color: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200'
    },
    order: 1
  },
  {
    id: 'announcements',
    name: 'Server Updates & News',
    translationKey: 'Server Updates & News',
    description: 'Official server announcements and updates',
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    order: 2
  },
  {
    id: 'builds',
    name: 'Building & Showcases',
    translationKey: 'Building & Showcases',
    description: 'Show off your builds and get inspiration',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    order: 3
  }
]

// Helper functions for easy access
export const getForumCategory = (id: string): ForumCategoryConfig | undefined => {
  return FORUM_CATEGORIES.find(cat => cat.id === id || cat.name === id)
}

export const getForumCategoryByName = (name: string): ForumCategoryConfig | undefined => {
  return FORUM_CATEGORIES.find(cat => cat.name === name)
}

export const getForumCategoryIds = (): string[] => {
  return FORUM_CATEGORIES.map(cat => cat.id)
}

export const getForumCategoryNames = (): string[] => {
  return FORUM_CATEGORIES.map(cat => cat.name)
}

// Original function for backward compatibility
export const getForumCategoriesForForm = (): Array<{ value: string; label: string; disabled?: boolean }> => {
  return FORUM_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.name,
      label: category.name,
      disabled: false
    }))
}

// New translation-aware function
export const getForumCategoriesForFormWithTranslation = (t: TranslationObject): Array<{ value: string; label: string; disabled?: boolean }> => {
  return FORUM_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.name,
      label: t.forum.categoryNames[category.name as keyof typeof t.forum.categoryNames] || category.name,
      disabled: false
    }))
}

export const getForumCategoryColor = (categoryId: string): { bg: string; text: string; border: string } => {
  const category = getForumCategory(categoryId)
  return category?.color || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
}

export const getDefaultForumCategory = (): string => {
  return FORUM_CATEGORIES[0].name // Returns 'General Discussion'
}