/**
 * Dex Form Configuration
 * Provides form configuration for creating and editing dex monsters
 */

import { z } from 'zod'
import type { ContentFormConfig, ContentFormField } from '@/app/components/shared/ContentForm'
import type { DexMonster } from '@/lib/types'
import type { TranslationObject } from '@/lib/translations/locales/en'
import { useCreateDexMonster, useUpdateDexMonster } from '@/lib/hooks/useDex'

// Flat form validation schema that matches form fields
const flatDexFormSchema = z.object({
  name: z.string().min(1, 'Monster name is required').max(100, 'Monster name too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  excerpt: z.string().max(200, 'Excerpt too long').optional(),
  category: z.string().min(1, 'Category is required'),
  modelPath: z.string().min(1, 'Model path is required'),
  behaviors: z.array(z.string()).default([]),
  health: z.string().min(1, 'Health is required'),
  damage: z.string().min(1, 'Damage is required'),
  speed: z.string().min(1, 'Speed is required'),
  xpDrop: z.string().min(1, 'XP drop is required'),
  worlds: z.array(z.string()).min(1, 'At least one world is required'),
  biomes: z.array(z.string()).min(1, 'At least one biome is required'),
  structures: z.array(z.string()).default([]),
  lightLevelMin: z.string().min(1, 'Light level min is required'),
  lightLevelMax: z.string().min(1, 'Light level max is required'),
  timeOfDay: z.enum(['day', 'night', 'any']),
  spawnRate: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('published')
})

const flatDexUpdateSchema = flatDexFormSchema.partial()

/**
 * Get dex form fields with translations
 * @param t Translation object
 * @param modelOptions Available model options from API
 */
export const getDexFormFields = (
  t: TranslationObject, 
  modelOptions: Array<{ value: string; label: string; disabled?: boolean }> = []
): ContentFormField[] => [
  {
    name: 'name',
    label: t?.dex?.forms?.create?.nameLabel || 'Monster Name',
    type: 'text',
    placeholder: t?.dex?.forms?.create?.namePlaceholder || 'Enter monster name...',
    required: true,
    maxLength: 100
  },
  {
    name: 'category',
    label: t?.dex?.forms?.create?.categoryLabel || 'Category',
    type: 'select',
    required: true,
    options: [
      { value: 'hostile', label: t?.dex?.categories?.hostile || 'Hostile' },
      { value: 'passive', label: t?.dex?.categories?.passive || 'Passive' },
      { value: 'neutral', label: t?.dex?.categories?.neutral || 'Neutral' },
      { value: 'boss', label: t?.dex?.categories?.boss || 'Boss' }
    ]
  },
  {
    name: 'modelPath',
    label: t?.dex?.forms?.create?.modelLabel || '3D Model',
    type: 'select',
    required: true,
    placeholder: t?.dex?.forms?.create?.modelPlaceholder || 'Select a 3D model...',
    help: t?.dex?.forms?.create?.modelHelp || 'Choose from available GLTF models',
    options: modelOptions.length > 0 ? modelOptions : [
      { value: '', label: 'Loading models...', disabled: true }
    ]
  },
  {
    name: 'excerpt',
    label: t?.dex?.forms?.create?.excerptLabel || 'Excerpt',
    type: 'textarea',
    placeholder: t?.dex?.forms?.create?.excerptPlaceholder || 'Brief description of the monster...',
    required: false,
    maxLength: 200,
    autoGenerate: true
  },
  {
    name: 'description',
    label: t?.dex?.forms?.create?.descriptionLabel || 'Description',
    type: 'wysiwyg',
    placeholder: t?.dex?.forms?.create?.descriptionPlaceholder || 'Describe the monster, its abilities, and characteristics...',
    required: true
  },
  {
    name: 'health',
    label: t?.dex?.detail?.health || 'Health',
    type: 'text',
    placeholder: '20',
    required: true,
    help: 'Monster health points'
  },
  {
    name: 'damage',
    label: t?.dex?.detail?.damage || 'Damage',
    type: 'text',
    placeholder: '5',
    required: true,
    help: 'Monster damage points'
  },
  {
    name: 'speed',
    label: t?.dex?.detail?.speed || 'Speed',
    type: 'text',
    placeholder: '1.0',
    required: true,
    help: 'Monster movement speed'
  },
  {
    name: 'xpDrop',
    label: t?.dex?.detail?.xpDrop || 'XP Drop',
    type: 'text',
    placeholder: '5',
    required: true,
    help: 'Experience points dropped when killed'
  },
  {
    name: 'worlds',
    label: t?.dex?.detail?.worlds || 'Worlds',
    type: 'tags',
    required: true,
    placeholder: 'overworld, nether, end...',
    help: 'Worlds where this monster spawns (comma separated)'
  },
  {
    name: 'biomes',
    label: t?.dex?.detail?.biomes || 'Biomes',
    type: 'tags',
    required: true,
    placeholder: 'plains, forest, desert...',
    help: 'Biomes where this monster spawns (comma separated)'
  },
  {
    name: 'structures',
    label: t?.dex?.detail?.structures || 'Structures',
    type: 'tags',
    required: false,
    placeholder: 'dungeon, stronghold, village...',
    help: 'Specific structures where this monster spawns (comma separated)'
  },
  {
    name: 'lightLevelMin',
    label: 'Light Level Min',
    type: 'text',
    required: true,
    placeholder: '0',
    help: 'Minimum light level (0-15)'
  },
  {
    name: 'lightLevelMax',
    label: 'Light Level Max',
    type: 'text',
    required: true,
    placeholder: '15',
    help: 'Maximum light level (0-15)'
  },
  {
    name: 'timeOfDay',
    label: 'Time of Day',
    type: 'select',
    required: true,
    options: [
      { value: 'day', label: 'Day' },
      { value: 'night', label: 'Night' },
      { value: 'any', label: 'Any Time' }
    ]
  },
  {
    name: 'spawnRate',
    label: 'Spawn Rate',
    type: 'select',
    required: true,
    options: [
      { value: 'common', label: 'Common' },
      { value: 'uncommon', label: 'Uncommon' },
      { value: 'rare', label: 'Rare' },
      { value: 'legendary', label: 'Legendary' }
    ]
  },
  {
    name: 'behaviors',
    label: 'Behaviors',
    type: 'tags',
    required: false,
    placeholder: 'aggressive, territorial, flying...',
    help: 'Monster behaviors (comma separated)'
  },
  {
    name: 'tags',
    label: t?.dex?.forms?.create?.tagsLabel || 'Tags',
    type: 'tags',
    required: false,
    placeholder: t?.dex?.forms?.create?.tagsPlaceholder || 'boss, fire, nether...',
    help: t?.dex?.forms?.create?.tagsHelp || 'Add relevant tags separated by commas'
  },
  {
    name: 'status',
    label: t?.dex?.forms?.create?.statusLabel || 'Status',
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
 * Get dex categories for form with translations
 */
export const getDexCategoriesForFormWithTranslation = (t: TranslationObject) => [
  {
    id: 'hostile',
    name: t?.dex?.categories?.hostile || 'Hostile',
    slug: 'hostile',
    description: 'Aggressive creatures that attack players',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  },
  {
    id: 'passive',
    name: t?.dex?.categories?.passive || 'Passive',
    slug: 'passive',
    description: 'Peaceful creatures that do not attack',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  },
  {
    id: 'neutral',
    name: t?.dex?.categories?.neutral || 'Neutral',
    slug: 'neutral',
    description: 'Creatures that attack only when provoked',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  },
  {
    id: 'boss',
    name: t?.dex?.categories?.boss || 'Boss',
    slug: 'boss',
    description: 'Powerful boss monsters with unique abilities',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { postsCount: 0, viewsCount: 0 }
  }
]

/**
 * Get default dex category
 */
export const getDefaultDexCategory = () => 'hostile'

/**
 * Get dex form configuration with translations
 * @param t Translation object
 * @param modelOptions Available model options from API
 */
export const getDexFormConfig = (
  t: TranslationObject, 
  modelOptions: Array<{ value: string; label: string; disabled?: boolean }> = []
): ContentFormConfig<DexMonster> => ({
  fields: getDexFormFields(t, modelOptions),
  validation: {
    create: flatDexFormSchema,
    update: flatDexUpdateSchema
  },
  module: 'dex', // Use centralized permission system for dex
  submitText: {
    create: t?.dex?.actions?.createMonster || 'Create Monster',
    edit: t?.dex?.actions?.editMonster || 'Edit Monster',
    creating: t?.common?.loading || 'Creating...',
    editing: t?.common?.loading || 'Editing...'
  },
  categoryConfig: {
    getCategories: () => getDexCategoriesForFormWithTranslation(t).map(cat => ({
      value: cat.slug,
      label: cat.name,
      disabled: !cat.isActive
    })),
    getDefault: getDefaultDexCategory
  },
  hooks: {
    useCreate: useCreateDexMonster,
    useUpdate: useUpdateDexMonster
  },
  routing: {
    getEditPath: (item: DexMonster) => `/dex/edit/${item.slug}`,
    getViewPath: (item: DexMonster) => `/dex/${item.slug}`
  }
})

/**
 * Category configuration with icons and colors
 */
export const DEX_CATEGORY_CONFIG = {
  'hostile': {
    icon: 'warning',
    color: 'red',
    order: 1
  },
  'passive': {
    icon: 'heart',
    color: 'green',
    order: 2
  },
  'neutral': {
    icon: 'user',
    color: 'yellow',
    order: 3
  },
  'boss': {
    icon: 'fire',
    color: 'purple',
    order: 4
  }
} as const