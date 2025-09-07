/**
 * Dex Form Configuration
 * Provides form configuration for creating and editing dex monsters
 */

import { z } from 'zod'
import type { ContentFormConfig, ContentFormField } from '@/app/components/shared/ContentForm'
import type { DexMonster } from '@/lib/types'
import type { TranslationObject } from '@/lib/translations/locales/en'
import { useCreateDexMonster, useUpdateDexMonster } from '@/lib/hooks/useDex'
import { flatDexFormSchema, flatDexUpdateSchema } from '@/lib/schemas/dex'

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
    name: 'element',
    label: t?.dex?.forms?.create?.elementLabel || 'Element',
    type: 'select',
    required: true,
    options: [
      { value: 'none', label: t?.dex?.elements?.none || 'None' },
      { value: 'fire', label: t?.dex?.elements?.fire || 'Fire' },
      { value: 'water', label: t?.dex?.elements?.water || 'Water' },
      { value: 'earth', label: t?.dex?.elements?.earth || 'Earth' },
      { value: 'air', label: t?.dex?.elements?.air || 'Air' },
      { value: 'light', label: t?.dex?.elements?.light || 'Light' },
      { value: 'dark', label: t?.dex?.elements?.dark || 'Dark' },
      { value: 'ice', label: t?.dex?.elements?.ice || 'Ice' },
      { value: 'lightning', label: t?.dex?.elements?.lightning || 'Lightning' }
    ]
  },
  {
    name: 'race',
    label: t?.dex?.forms?.create?.raceLabel || 'Race',
    type: 'select',
    required: true,
    options: [
      { value: 'god', label: t?.dex?.races?.god || 'God' },
      { value: 'dragon', label: t?.dex?.races?.dragon || 'Dragon' },
      { value: 'goblin', label: t?.dex?.races?.goblin || 'Goblin' },
      { value: 'orc', label: t?.dex?.races?.orc || 'Orc' },
      { value: 'elf', label: t?.dex?.races?.elf || 'Elf' },
      { value: 'dwarf', label: t?.dex?.races?.dwarf || 'Dwarf' },
      { value: 'troll', label: t?.dex?.races?.troll || 'Troll' },
      { value: 'giant', label: t?.dex?.races?.giant || 'Giant' },
      { value: 'undead', label: t?.dex?.races?.undead || 'Undead' },
      { value: 'skeleton', label: t?.dex?.races?.skeleton || 'Skeleton' },
      { value: 'zombie', label: t?.dex?.races?.zombie || 'Zombie' },
      { value: 'vampire', label: t?.dex?.races?.vampire || 'Vampire' },
      { value: 'ghost', label: t?.dex?.races?.ghost || 'Ghost' },
      { value: 'demon', label: t?.dex?.races?.demon || 'Demon' },
      { value: 'angel', label: t?.dex?.races?.angel || 'Angel' },
      { value: 'fairy', label: t?.dex?.races?.fairy || 'Fairy' },
      { value: 'phoenix', label: t?.dex?.races?.phoenix || 'Phoenix' },
      { value: 'beast', label: t?.dex?.races?.beast || 'Beast' },
      { value: 'wolf', label: t?.dex?.races?.wolf || 'Wolf' },
      { value: 'bear', label: t?.dex?.races?.bear || 'Bear' },
      { value: 'cat', label: t?.dex?.races?.cat || 'Cat' },
      { value: 'bird', label: t?.dex?.races?.bird || 'Bird' },
      { value: 'fish', label: t?.dex?.races?.fish || 'Fish' },
      { value: 'snake', label: t?.dex?.races?.snake || 'Snake' },
      { value: 'spider', label: t?.dex?.races?.spider || 'Spider' },
      { value: 'insect', label: t?.dex?.races?.insect || 'Insect' },
      { value: 'slime', label: t?.dex?.races?.slime || 'Slime' },
      { value: 'golem', label: t?.dex?.races?.golem || 'Golem' },
      { value: 'construct', label: t?.dex?.races?.construct || 'Construct' },
      { value: 'robot', label: t?.dex?.races?.robot || 'Robot' },
      { value: 'elemental', label: t?.dex?.races?.elemental || 'Elemental' },
      { value: 'plant', label: t?.dex?.races?.plant || 'Plant' },
      { value: 'humanoid', label: t?.dex?.races?.humanoid || 'Humanoid' },
      { value: 'alien', label: t?.dex?.races?.alien || 'Alien' },
      { value: 'void', label: t?.dex?.races?.void || 'Void' }
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