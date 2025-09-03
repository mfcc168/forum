/**
 * Centralized Blog Categories Configuration
 * 
 * This file defines all blog categories used throughout the application.
 * Update this file when adding/removing/reordering categories.
 * 
 * Order reflects usage frequency and importance:
 * - Most frequently used categories first
 * - Important announcement categories prioritized
 * - Alphabetical for similar importance
 */

import type { TranslationObject } from '@/lib/translations/locales/en'

export interface BlogCategoryConfig {
  id: string
  translationKey: string
  description: string
  color: {
    bg: string
    text: string
  }
  order: number
}

export const BLOG_CATEGORIES: BlogCategoryConfig[] = [
  {
    id: 'update',
    translationKey: 'update',
    description: 'Server updates and feature releases',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800'
    },
    order: 1
  },
  {
    id: 'announcement',
    translationKey: 'announcement',
    description: 'Important server announcements and news',
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-800'
    },
    order: 2
  },
  {
    id: 'event',
    translationKey: 'event',
    description: 'Community events and activities',
    color: {
      bg: 'bg-orange-100',
      text: 'text-orange-800'
    },
    order: 3
  },
  {
    id: 'general',
    translationKey: 'general',
    description: 'General posts and discussions',
    color: {
      bg: 'bg-slate-100',
      text: 'text-slate-800'
    },
    order: 4
  }
]

// Helper functions for easy access
export const getBlogCategory = (id: string): BlogCategoryConfig | undefined => {
  return BLOG_CATEGORIES.find(cat => cat.id === id)
}

export const getBlogCategoryIds = (): string[] => {
  return BLOG_CATEGORIES.map(cat => cat.id)
}

// Original function for backward compatibility
export const getBlogCategoriesForForm = (): Array<{ value: string; label: string; disabled?: boolean }> => {
  return BLOG_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.id,
      label: category.translationKey.charAt(0).toUpperCase() + category.translationKey.slice(1),
      disabled: false
    }))
}

// New translation-aware function
export const getBlogCategoriesForFormWithTranslation = (t: TranslationObject): Array<{ value: string; label: string; disabled?: boolean }> => {
  return BLOG_CATEGORIES
    .sort((a, b) => a.order - b.order)
    .map(category => ({
      value: category.id,
      label: t.blog.categoryNames[category.translationKey as keyof typeof t.blog.categoryNames] || category.translationKey.charAt(0).toUpperCase() + category.translationKey.slice(1),
      disabled: false
    }))
}

export const getBlogCategoryColor = (categoryId: string): { bg: string; text: string } => {
  const category = getBlogCategory(categoryId)
  return category?.color || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const getDefaultBlogCategory = (): string => {
  return BLOG_CATEGORIES[0].id // Returns the first (most commonly used) category
}