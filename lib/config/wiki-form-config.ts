/**
 * Wiki Form Configuration
 * Provides form configuration for creating and editing wiki guides
 */

import type { ContentFormConfig, ContentFormField } from '@/app/components/shared/ContentForm'
import type { WikiGuide } from '@/lib/types'
import type { TranslationObject } from '@/lib/translations/locales/en'
import { useCreateWikiGuide, useUpdateWikiGuide } from '@/lib/hooks/useWiki'
import { createWikiGuideSchema, updateWikiGuideSchema } from '@/lib/schemas/wiki'

/**
 * Get wiki form fields with translations
 */
export const getWikiFormFields = (t: TranslationObject): ContentFormField[] => [
  {
    name: 'title',
    label: t?.wiki?.forms?.createGuide?.titleLabel || 'Title',
    type: 'text',
    placeholder: t?.wiki?.forms?.createGuide?.titlePlaceholder || 'Enter guide title...',
    required: true,
    maxLength: 200
  },
  {
    name: 'excerpt',
    label: t?.wiki?.forms?.createGuide?.excerptLabel || 'Excerpt',
    type: 'textarea',
    placeholder: t?.wiki?.forms?.createGuide?.excerptPlaceholder || 'Brief description of the guide...',
    required: true,
    maxLength: 500
  },
  {
    name: 'category',
    label: t?.wiki?.forms?.createGuide?.categoryLabel || 'Category',
    type: 'select',
    required: true,
    options: [
      { value: 'getting-started', label: t?.wiki?.categories?.gettingStarted || 'Getting Started' },
      { value: 'gameplay', label: t?.wiki?.categories?.gameplay || 'Gameplay' },
      { value: 'features', label: t?.wiki?.categories?.features || 'Features' },
      { value: 'community', label: t?.wiki?.categories?.community || 'Community' }
    ]
  },
  {
    name: 'difficulty',
    label: t?.wiki?.forms?.createGuide?.difficultyLabel || 'Difficulty',
    type: 'select',
    required: true,
    options: [
      { value: 'beginner', label: t?.wiki?.difficulty?.beginner || 'Beginner' },
      { value: 'intermediate', label: t?.wiki?.difficulty?.intermediate || 'Intermediate' },
      { value: 'advanced', label: t?.wiki?.difficulty?.advanced || 'Advanced' }
    ]
  },
  {
    name: 'content',
    label: t?.wiki?.forms?.createGuide?.contentLabel || 'Content',
    type: 'wysiwyg',
    placeholder: t?.wiki?.forms?.createGuide?.contentPlaceholder || 'Write your guide content here...',
    required: true
  },
  {
    name: 'tags',
    label: t?.wiki?.forms?.createGuide?.tagsLabel || 'Tags',
    type: 'tags',
    placeholder: t?.wiki?.forms?.createGuide?.tagsPlaceholder || 'Add tags...',
    help: t?.wiki?.forms?.createGuide?.tagsHelp || 'Press Enter to add tags'
  },
  {
    name: 'status',
    label: t?.wiki?.forms?.createGuide?.statusLabel || 'Status',
    type: 'select',
    required: true,
    options: [
      { value: 'published', label: t?.wiki?.status?.published || 'Published' },
      { value: 'draft', label: t?.wiki?.status?.draft || 'Draft' },
      { value: 'archived', label: t?.wiki?.status?.archived || 'Archived' }
    ]
  }
]

/**
 * Get wiki categories for form with translations
 */
export const getWikiCategoriesForFormWithTranslation = (t: TranslationObject) => [
  {
    id: 'getting-started',
    name: t?.wiki?.categories?.gettingStarted || 'Getting Started',
    slug: 'getting-started',
    description: t?.wiki?.categories?.gettingStartedDesc || 'Essential guides for new players',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  },
  {
    id: 'gameplay',
    name: t?.wiki?.categories?.gameplay || 'Gameplay',
    slug: 'gameplay',
    description: t?.wiki?.categories?.gameplayDesc || 'Game mechanics and strategies',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  },
  {
    id: 'features',
    name: t?.wiki?.categories?.features || 'Features',
    slug: 'features',
    description: t?.wiki?.categories?.featuresDesc || 'Server features and systems',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  },
  {
    id: 'community',
    name: t?.wiki?.categories?.community || 'Community',
    slug: 'community',
    description: t?.wiki?.categories?.communityDesc || 'Community guidelines and social features',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  }
]

/**
 * Get default wiki category
 */
export const getDefaultWikiCategory = () => 'getting-started'

/**
 * Get wiki form configuration with translations
 */
export const getWikiFormConfig = (t: TranslationObject): ContentFormConfig<WikiGuide> => ({
  fields: getWikiFormFields(t),
  validation: {
    create: createWikiGuideSchema,
    update: updateWikiGuideSchema
  },
  module: 'wiki', // Use centralized permission system for wiki
  submitText: {
    create: t?.wiki?.actions?.createGuide || 'Create Guide',
    edit: t?.wiki?.actions?.editGuide || 'Edit Guide',
    creating: t?.wiki?.actions?.creating || 'Creating...',
    editing: t?.wiki?.actions?.editing || 'Editing...'
  },
  categoryConfig: {
    getCategories: () => getWikiCategoriesForFormWithTranslation(t).map(cat => ({
      value: cat.slug,
      label: cat.name,
      disabled: !cat.isActive
    })),
    getDefault: getDefaultWikiCategory
  },
  hooks: {
    useCreate: useCreateWikiGuide,
    useUpdate: useUpdateWikiGuide
  },
  routing: {
    getEditPath: (item: WikiGuide) => `/wiki/edit/${item.slug}`,
    getViewPath: (item: WikiGuide) => `/wiki/${item.slug}`
  }
})

/**
 * Category configuration with icons and colors
 */
export const WIKI_CATEGORY_CONFIG = {
  'getting-started': {
    icon: 'user',
    color: 'emerald',
    order: 1
  },
  'gameplay': {
    icon: 'gamepad',
    color: 'blue',
    order: 2
  },
  'features': {
    icon: 'sparkles',
    color: 'purple',
    order: 3
  },
  'community': {
    icon: 'users',
    color: 'orange',
    order: 4
  }
} as const

/**
 * Difficulty configuration with colors
 */
export const WIKI_DIFFICULTY_CONFIG = {
  'beginner': {
    color: 'green',
    icon: 'star'
  },
  'intermediate': {
    color: 'yellow',
    icon: 'star-half'
  },
  'advanced': {
    color: 'red',
    icon: 'star-fill'
  }
} as const