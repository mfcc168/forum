/**
 * Dex Form Configuration
 * Provides form configuration for creating and editing dex monsters
 */

import type { ContentFormConfig, ContentFormField } from '@/app/components/shared/ContentForm'
import type { DexMonster } from '@/lib/types'
import type { TranslationObject } from '@/lib/translations/locales/en'
import { dexHooks } from '@/lib/hooks/useDex'
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
    options: modelOptions.length > 0 ? [
      { value: '', label: 'Select a 3D model...', disabled: false },
      ...modelOptions
    ] : [
      { value: '', label: 'Loading models...', disabled: true }
    ]
  },
  // 3D Model Settings Section
  {
    name: 'modelScale',
    label: 'Model Scale',
    type: 'range' as const,
    required: false,
    help: 'Adjust the size of the 3D model (0.01-3.0)',
    min: 0.01,
    max: 3.0,
    step: 0.01,
    defaultValue: 1.0
  },
  {
    name: 'camera.position.x',
    label: 'Camera Position X',
    type: 'range' as const,
    required: false,
    help: 'Horizontal camera position (-10 to 10)',
    min: -10,
    max: 10,
    step: 0.1,
    defaultValue: 2
  },
  {
    name: 'camera.position.y',
    label: 'Camera Position Y',
    type: 'range' as const,
    required: false,
    help: 'Vertical camera position (-10 to 10)',
    min: -10,
    max: 10,
    step: 0.1,
    defaultValue: 2
  },
  {
    name: 'camera.position.z',
    label: 'Camera Position Z',
    type: 'range' as const,
    required: false,
    help: 'Camera distance (1 to 20)',
    min: 1,
    max: 20,
    step: 0.1,
    defaultValue: 4
  },
  {
    name: 'camera.lookAt.x',
    label: 'Look At X',
    type: 'range' as const,
    required: false,
    help: 'Horizontal look at target (-5 to 5)',
    min: -5,
    max: 5,
    step: 0.1,
    defaultValue: 0
  },
  {
    name: 'camera.lookAt.y',
    label: 'Look At Y',
    type: 'range' as const,
    required: false,
    help: 'Vertical look at target (-5 to 5)',
    min: -5,
    max: 5,
    step: 0.1,
    defaultValue: 0
  },
  {
    name: 'camera.lookAt.z',
    label: 'Look At Z',
    type: 'range' as const,
    required: false,
    help: 'Depth look at target (-5 to 5)',
    min: -5,
    max: 5,
    step: 0.1,
    defaultValue: 0
  },
  // 3D Model Preview (non-interactive)
  {
    name: 'model3dPreview',
    label: '3D Model Preview',
    type: 'model3dPreview' as const,
    required: false,
    help: 'Live preview of your 3D model with current settings',
    modelPathField: 'modelPath'
  },
  {
    name: 'excerpt',
    label: t?.dex?.forms?.create?.excerptLabel || 'Excerpt',
    type: 'textarea',
    placeholder: t?.dex?.forms?.create?.excerptPlaceholder || 'Brief description of the monster...',
    required: false,
    maxLength: 500,
    autoGenerate: true
  },
  {
    name: 'description',
    label: t?.dex?.forms?.create?.descriptionLabel || 'Description',
    type: 'wysiwyg',
    placeholder: t?.dex?.forms?.create?.descriptionPlaceholder || 'Describe the monster, its abilities, and characteristics...',
    required: false
  },
  {
    name: 'stats.health',
    label: t?.dex?.detail?.health || 'Health',
    type: 'text',
    placeholder: '20',
    required: true,
    help: t?.dex?.forms?.create?.healthHelp || 'Monster health points'
  },
  {
    name: 'stats.damage',
    label: t?.dex?.detail?.damage || 'Damage',
    type: 'text',
    placeholder: '5',
    required: true,
    help: t?.dex?.forms?.create?.damageHelp || 'Monster damage points'
  },
  {
    name: 'stats.xpDrop',
    label: t?.dex?.detail?.xpDrop || 'XP Drop',
    type: 'text',
    placeholder: '5',
    required: true,
    help: t?.dex?.forms?.create?.xpDropHelp || 'Experience points dropped when killed'
  },
  {
    name: 'spawning.worlds',
    label: t?.dex?.detail?.worlds || 'Worlds',
    type: 'select',
    required: true,
    options: [
      { value: 'overworld', label: t?.dex?.worlds?.overworld || 'Overworld' },
      { value: 'nether', label: t?.dex?.worlds?.nether || 'Nether' },
      { value: 'end', label: t?.dex?.worlds?.end || 'End' },
      { value: 'magic', label: t?.dex?.worlds?.magic || 'Magic World' },
      { value: 'heaven', label: t?.dex?.worlds?.heaven || 'Heaven' },
      { value: 'dungeon', label: t?.dex?.worlds?.dungeon || 'Dungeon' }
    ]
  },
  {
    name: 'spawning.biomes',
    label: t?.dex?.detail?.biomes || 'Biomes',
    type: 'multiselect',
    required: false,
    help: t?.dex?.forms?.create?.biomesHelp || 'Biomes where this monster spawns',
    options: [
      // Overworld Biomes
      { value: 'plains', label: t?.dex?.biomes?.plains || 'Plains' },
      { value: 'forest', label: t?.dex?.biomes?.forest || 'Forest' },
      { value: 'birch_forest', label: t?.dex?.biomes?.birch_forest || 'Birch Forest' },
      { value: 'dark_forest', label: t?.dex?.biomes?.dark_forest || 'Dark Forest' },
      { value: 'old_growth_birch_forest', label: t?.dex?.biomes?.old_growth_birch_forest || 'Old Growth Birch Forest' },
      { value: 'old_growth_pine_taiga', label: t?.dex?.biomes?.old_growth_pine_taiga || 'Old Growth Pine Taiga' },
      { value: 'old_growth_spruce_taiga', label: t?.dex?.biomes?.old_growth_spruce_taiga || 'Old Growth Spruce Taiga' },
      { value: 'taiga', label: t?.dex?.biomes?.taiga || 'Taiga' },
      { value: 'snowy_taiga', label: t?.dex?.biomes?.snowy_taiga || 'Snowy Taiga' },
      { value: 'savanna', label: t?.dex?.biomes?.savanna || 'Savanna' },
      { value: 'savanna_plateau', label: t?.dex?.biomes?.savanna_plateau || 'Savanna Plateau' },
      { value: 'windswept_hills', label: t?.dex?.biomes?.windswept_hills || 'Windswept Hills' },
      { value: 'windswept_gravelly_hills', label: t?.dex?.biomes?.windswept_gravelly_hills || 'Windswept Gravelly Hills' },
      { value: 'windswept_forest', label: t?.dex?.biomes?.windswept_forest || 'Windswept Forest' },
      { value: 'windswept_savanna', label: t?.dex?.biomes?.windswept_savanna || 'Windswept Savanna' },
      { value: 'jungle', label: t?.dex?.biomes?.jungle || 'Jungle' },
      { value: 'sparse_jungle', label: t?.dex?.biomes?.sparse_jungle || 'Sparse Jungle' },
      { value: 'bamboo_jungle', label: t?.dex?.biomes?.bamboo_jungle || 'Bamboo Jungle' },
      { value: 'desert', label: t?.dex?.biomes?.desert || 'Desert' },
      { value: 'swamp', label: t?.dex?.biomes?.swamp || 'Swamp' },
      { value: 'mangrove_swamp', label: t?.dex?.biomes?.mangrove_swamp || 'Mangrove Swamp' },
      { value: 'mushroom_fields', label: t?.dex?.biomes?.mushroom_fields || 'Mushroom Fields' },
      { value: 'ice_spikes', label: t?.dex?.biomes?.ice_spikes || 'Ice Spikes' },
      { value: 'snowy_plains', label: t?.dex?.biomes?.snowy_plains || 'Snowy Plains' },
      { value: 'snowy_slopes', label: t?.dex?.biomes?.snowy_slopes || 'Snowy Slopes' },
      { value: 'frozen_peaks', label: t?.dex?.biomes?.frozen_peaks || 'Frozen Peaks' },
      { value: 'jagged_peaks', label: t?.dex?.biomes?.jagged_peaks || 'Jagged Peaks' },
      { value: 'stony_peaks', label: t?.dex?.biomes?.stony_peaks || 'Stony Peaks' },
      { value: 'meadow', label: t?.dex?.biomes?.meadow || 'Meadow' },
      { value: 'grove', label: t?.dex?.biomes?.grove || 'Grove' },
      { value: 'cherry_grove', label: t?.dex?.biomes?.cherry_grove || 'Cherry Grove' },
      { value: 'stony_shore', label: t?.dex?.biomes?.stony_shore || 'Stony Shore' },
      { value: 'beach', label: t?.dex?.biomes?.beach || 'Beach' },
      { value: 'snowy_beach', label: t?.dex?.biomes?.snowy_beach || 'Snowy Beach' },
      { value: 'ocean', label: t?.dex?.biomes?.ocean || 'Ocean' },
      { value: 'deep_ocean', label: t?.dex?.biomes?.deep_ocean || 'Deep Ocean' },
      { value: 'lukewarm_ocean', label: t?.dex?.biomes?.lukewarm_ocean || 'Lukewarm Ocean' },
      { value: 'deep_lukewarm_ocean', label: t?.dex?.biomes?.deep_lukewarm_ocean || 'Deep Lukewarm Ocean' },
      { value: 'warm_ocean', label: t?.dex?.biomes?.warm_ocean || 'Warm Ocean' },
      { value: 'cold_ocean', label: t?.dex?.biomes?.cold_ocean || 'Cold Ocean' },
      { value: 'deep_cold_ocean', label: t?.dex?.biomes?.deep_cold_ocean || 'Deep Cold Ocean' },
      { value: 'frozen_ocean', label: t?.dex?.biomes?.frozen_ocean || 'Frozen Ocean' },
      { value: 'deep_frozen_ocean', label: t?.dex?.biomes?.deep_frozen_ocean || 'Deep Frozen Ocean' },
      { value: 'river', label: t?.dex?.biomes?.river || 'River' },
      { value: 'frozen_river', label: t?.dex?.biomes?.frozen_river || 'Frozen River' },
      { value: 'dripstone_caves', label: t?.dex?.biomes?.dripstone_caves || 'Dripstone Caves' },
      { value: 'lush_caves', label: t?.dex?.biomes?.lush_caves || 'Lush Caves' },
      { value: 'deep_dark', label: t?.dex?.biomes?.deep_dark || 'Deep Dark' },
      // Nether Biomes
      { value: 'nether_wastes', label: t?.dex?.biomes?.nether_wastes || 'Nether Wastes' },
      { value: 'soul_sand_valley', label: t?.dex?.biomes?.soul_sand_valley || 'Soul Sand Valley' },
      { value: 'crimson_forest', label: t?.dex?.biomes?.crimson_forest || 'Crimson Forest' },
      { value: 'warped_forest', label: t?.dex?.biomes?.warped_forest || 'Warped Forest' },
      { value: 'basalt_deltas', label: t?.dex?.biomes?.basalt_deltas || 'Basalt Deltas' },
      // End Biomes
      { value: 'the_end', label: t?.dex?.biomes?.the_end || 'The End' },
      { value: 'small_end_islands', label: t?.dex?.biomes?.small_end_islands || 'Small End Islands' },
      { value: 'end_midlands', label: t?.dex?.biomes?.end_midlands || 'End Midlands' },
      { value: 'end_highlands', label: t?.dex?.biomes?.end_highlands || 'End Highlands' },
      { value: 'end_barrens', label: t?.dex?.biomes?.end_barrens || 'End Barrens' }
    ]
  },
  {
    name: 'spawning.structures',
    label: t?.dex?.detail?.structures || 'Structures',
    type: 'multiselect',
    required: false,
    help: t?.dex?.forms?.create?.structuresHelp || 'Specific structures where this monster spawns',
    options: [
      // Generated Structures
      { value: 'village', label: t?.dex?.structures?.village || 'Village' },
      { value: 'desert_pyramid', label: t?.dex?.structures?.desert_pyramid || 'Desert Pyramid' },
      { value: 'igloo', label: t?.dex?.structures?.igloo || 'Igloo' },
      { value: 'jungle_pyramid', label: t?.dex?.structures?.jungle_pyramid || 'Jungle Pyramid' },
      { value: 'swamp_hut', label: t?.dex?.structures?.swamp_hut || 'Swamp Hut' },
      { value: 'pillager_outpost', label: t?.dex?.structures?.pillager_outpost || 'Pillager Outpost' },
      { value: 'mansion', label: t?.dex?.structures?.mansion || 'Woodland Mansion' },
      { value: 'monument', label: t?.dex?.structures?.monument || 'Ocean Monument' },
      { value: 'stronghold', label: t?.dex?.structures?.stronghold || 'Stronghold' },
      { value: 'mineshaft', label: t?.dex?.structures?.mineshaft || 'Mineshaft' },
      { value: 'dungeon', label: t?.dex?.structures?.dungeon || 'Dungeon' },
      { value: 'buried_treasure', label: t?.dex?.structures?.buried_treasure || 'Buried Treasure' },
      { value: 'shipwreck', label: t?.dex?.structures?.shipwreck || 'Shipwreck' },
      { value: 'ocean_ruin', label: t?.dex?.structures?.ocean_ruin || 'Ocean Ruin' },
      { value: 'ruined_portal', label: t?.dex?.structures?.ruined_portal || 'Ruined Portal' },
      { value: 'ancient_city', label: t?.dex?.structures?.ancient_city || 'Ancient City' },
      { value: 'trail_ruins', label: t?.dex?.structures?.trail_ruins || 'Trail Ruins' },
      // Nether Structures
      { value: 'nether_fortress', label: t?.dex?.structures?.nether_fortress || 'Nether Fortress' },
      { value: 'bastion_remnant', label: t?.dex?.structures?.bastion_remnant || 'Bastion Remnant' },
      // End Structures
      { value: 'end_city', label: t?.dex?.structures?.end_city || 'End City' }
    ]
  },
  {
    name: 'spawning.lightLevel.min',
    label: t?.dex?.forms?.create?.lightLevelMinLabel || 'Light Level Min',
    type: 'text',
    required: false,
    placeholder: '0',
    help: t?.dex?.forms?.create?.lightLevelMinHelp || 'Minimum light level (0-15)'
  },
  {
    name: 'spawning.lightLevel.max',
    label: t?.dex?.forms?.create?.lightLevelMaxLabel || 'Light Level Max',
    type: 'text',
    required: false,
    placeholder: '15',
    help: t?.dex?.forms?.create?.lightLevelMaxHelp || 'Maximum light level (0-15)'
  },
  {
    name: 'spawning.timeOfDay',
    label: t?.dex?.forms?.create?.timeOfDayLabel || 'Time of Day',
    type: 'select',
    required: false,
    options: [
      { value: 'day', label: t?.dex?.timeOfDay?.day || 'Day' },
      { value: 'night', label: t?.dex?.timeOfDay?.night || 'Night' },
      { value: 'any', label: t?.dex?.timeOfDay?.any || 'Any Time' }
    ]
  },
  {
    name: 'spawning.spawnRate',
    label: t?.dex?.forms?.create?.spawnRateLabel || 'Spawn Rate',
    type: 'select',
    required: true,
    options: [
      { value: 'common', label: t?.dex?.spawning?.common || 'Common' },
      { value: 'uncommon', label: t?.dex?.spawning?.uncommon || 'Uncommon' },
      { value: 'rare', label: t?.dex?.spawning?.rare || 'Rare' },
      { value: 'legendary', label: t?.dex?.spawning?.legendary || 'Legendary' }
    ]
  },
  {
    name: 'behaviors',
    label: t?.dex?.forms?.create?.behaviorsLabel || 'Behaviors',
    type: 'tags',
    required: false,
    placeholder: t?.dex?.forms?.create?.behaviorsPlaceholder || 'aggressive, territorial, flying...',
    help: t?.dex?.forms?.create?.behaviorsHelp || 'Monster behaviors (comma separated)'
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
    useCreate: dexHooks.useCreateContent,
    useUpdate: dexHooks.useUpdateContent
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