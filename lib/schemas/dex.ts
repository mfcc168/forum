/**
 * Dex (Monster) Validation Schemas
 * 
 * Zod schemas for validating monster data, following the same patterns
 * as wiki, blog, and forum schemas.
 */

import { z } from 'zod'
import { 
  titleSchema,
  metaDescriptionSchema,
  tagsSchema,
  defaultStatusSchema,
  userRefSchema,
  baseStatsSchema,
  categoryStringSchema
} from './common'

// ============================================================================
// MONSTER SCHEMAS
// ============================================================================

export const monsterDropSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  dropChance: z.number().min(0).max(1),
  minQuantity: z.number().min(1),
  maxQuantity: z.number().min(1),
  isRare: z.boolean()
})

export const spawningInfoSchema = z.object({
  worlds: z.enum(['overworld', 'nether', 'end', 'magic', 'heaven', 'dungeon']).default('overworld'), // Required select with default
  biomes: z.array(z.string()).optional(), // Made optional
  structures: z.array(z.string()).optional(),
  lightLevel: z.object({
    min: z.number().min(0).max(15).optional(),
    max: z.number().min(0).max(15).optional()
  }).optional().transform((val) => {
    // If both min and max are undefined, return undefined to omit the field
    if (!val || (val.min === undefined && val.max === undefined)) {
      return undefined
    }
    return val
  }), // Made optional with smart omission
  timeOfDay: z.enum(['day', 'night', 'any']).optional(), // Made optional
  spawnRate: z.enum(['common', 'uncommon', 'rare', 'legendary'])
})

export const monsterStatsSchema = baseStatsSchema.extend({
  health: z.number().min(1),
  damage: z.number().min(0),
  xpDrop: z.number().min(0)
})

// userRefSchema now imported from common

// ============================================================================
// CREATE MONSTER SCHEMA (for API routes)
// ============================================================================

export const createMonsterSchema = z.object({
  name: titleSchema,
  description: z.string().optional(),
  excerpt: z.string().optional(),
  category: categoryStringSchema,
  element: z.string().min(1, 'Element is required'),
  race: z.string().min(1, 'Race is required'),
  modelPath: z.string().min(1, 'Model path is required'),
  modelScale: z.number().min(0.01).max(10).optional().default(1.0), // Scale multiplier with new range
  camera: z.object({
    position: z.object({
      x: z.number().optional().default(2),
      y: z.number().optional().default(2),
      z: z.number().optional().default(4)
    }).optional(),
    lookAt: z.object({
      x: z.number().optional().default(0),
      y: z.number().optional().default(0),
      z: z.number().optional().default(0)
    }).optional()
  }).optional(),
  behaviors: z.array(z.string()).default([]),
  drops: z.array(monsterDropSchema).default([]),
  spawning: spawningInfoSchema,
  tags: tagsSchema,
  stats: z.object({
    health: z.number().min(1),
    damage: z.number().min(0),
    xpDrop: z.number().min(0)
  }),
  status: defaultStatusSchema,
  metaDescription: metaDescriptionSchema
})

// ============================================================================
// UPDATE MONSTER SCHEMA (for API routes)
// ============================================================================

export const updateMonsterSchema = createMonsterSchema.partial()

// ============================================================================
// FLAT FORM SCHEMAS (for ContentForm compatibility)
// ============================================================================

/**
 * Flat form schema that matches ContentForm field structure
 * Used for form validation before transforming to nested monster structure
 */
export const flatDexFormSchema = z.object({
  name: titleSchema,
  description: z.string().optional().transform((val) => {
    // Allow empty descriptions but validate if provided
    if (!val || val.trim() === '') return undefined
    return val
  }),
  excerpt: z.string().optional().transform((val) => {
    // Allow empty excerpts but validate if provided
    if (!val || val.trim() === '') return undefined
    return val
  }),
  category: categoryStringSchema,
  element: z.string().min(1, 'Element is required'),
  race: z.string().min(1, 'Race is required'),
  modelPath: z.string().min(1, 'Model path is required'),
  modelScale: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val)
      return isNaN(num) ? 1.0 : num // Default to 1.0 if invalid
    }
    return val
  }).optional().default(1.0),
  // Camera nested object to match form processor output
  camera: z.object({
    position: z.object({
      x: z.number().default(2),
      y: z.number().default(2),
      z: z.number().default(4)
    }).optional(),
    lookAt: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0)
    }).optional()
  }).optional(),
  behaviors: z.array(z.string()).default([]),
  // Stats nested object to match form processor output (numbers from form processor)
  stats: z.object({
    health: z.number().min(1, 'Health must be at least 1'),
    damage: z.number().min(0, 'Damage must be at least 0'),
    xpDrop: z.number().min(0, 'XP drop must be at least 0')
  }),
  // Spawning nested object to match form processor output
  spawning: z.object({
    worlds: z.enum(['overworld', 'nether', 'end', 'magic', 'heaven', 'dungeon']).default('overworld'),
    biomes: z.union([z.array(z.string()), z.string()]).transform((val) => {
      if (Array.isArray(val)) return val
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map(s => s.trim()).filter(Boolean)
      }
      return []
    }).default([]),
    structures: z.union([z.array(z.string()), z.string()]).transform((val) => {
      if (Array.isArray(val)) return val
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map(s => s.trim()).filter(Boolean)
      }
      return []
    }).default([]),
    lightLevelMin: z.string().optional(),
    lightLevelMax: z.string().optional(),
    timeOfDay: z.enum(['day', 'night', 'any']).optional(),
    spawnRate: z.enum(['common', 'uncommon', 'rare', 'legendary'])
  }),
  tags: tagsSchema,
  status: defaultStatusSchema
})

// Create explicit partial schema to ensure dot-notation fields work
export const flatDexUpdateSchema = z.object({
  name: titleSchema.optional(),
  description: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined
    return val
  }),
  excerpt: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined
    return val
  }),
  category: categoryStringSchema.optional(),
  element: z.string().min(1, 'Element is required').optional(),
  race: z.string().min(1, 'Race is required').optional(),
  modelPath: z.string().min(1, 'Model path is required').optional(),
  modelScale: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val)
      return isNaN(num) ? 1.0 : num
    }
    return val
  }).optional(),
  // Camera nested object to match form processor output
  camera: z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number()
    }).optional(),
    lookAt: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number()
    }).optional()
  }).optional(),
  behaviors: z.union([z.array(z.string()), z.string()]).transform((val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }).optional(),
  // Stats nested object to match form processor output (numbers from form processor)
  stats: z.object({
    health: z.number().min(1, 'Health must be at least 1'),
    damage: z.number().min(0, 'Damage must be at least 0'),
    xpDrop: z.number().min(0, 'XP drop must be at least 0')
  }).optional(),
  // Spawning nested object to match form processor output
  spawning: z.object({
    worlds: z.enum(['overworld', 'nether', 'end', 'magic', 'heaven', 'dungeon']),
    biomes: z.union([z.array(z.string()), z.string()]).transform((val) => {
      if (Array.isArray(val)) return val
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map(s => s.trim()).filter(Boolean)
      }
      return []
    }),
    structures: z.union([z.array(z.string()), z.string()]).transform((val) => {
      if (Array.isArray(val)) return val
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map(s => s.trim()).filter(Boolean)
      }
      return []
    }),
    lightLevelMin: z.string().optional(),
    lightLevelMax: z.string().optional(),
    timeOfDay: z.enum(['day', 'night', 'any']).optional(),
    spawnRate: z.enum(['common', 'uncommon', 'rare', 'legendary'])
  }).optional(),
  tags: tagsSchema.optional(),
  status: defaultStatusSchema.optional()
})

// ============================================================================
// FILTER SCHEMAS (for query validation)
// ============================================================================

export const dexFiltersSchema = z.object({
  category: z.string().optional(),
  element: z.enum(['none', 'fire', 'water', 'earth', 'air', 'light', 'dark', 'ice', 'lightning']).optional(),
  race: z.enum(['god', 'dragon', 'goblin', 'orc', 'elf', 'dwarf', 'troll', 'giant', 'undead', 'skeleton', 'zombie', 'vampire', 'ghost', 'demon', 'angel', 'fairy', 'phoenix', 'beast', 'wolf', 'bear', 'cat', 'bird', 'fish', 'snake', 'spider', 'insect', 'slime', 'golem', 'construct', 'robot', 'elemental', 'plant', 'humanoid', 'alien', 'void']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  spawnRate: z.enum(['common', 'uncommon', 'rare', 'legendary']).optional(),
  biome: z.string().optional(),
  world: z.string().optional(),
  structure: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['latest', 'popular', 'views', 'name']).default('latest')
})

// ============================================================================
// MONGODB DOCUMENT SCHEMAS (for validation after DB queries)
// ============================================================================

export const MongoDexMonsterSchema = z.object({
  _id: z.any(), // ObjectId
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  category: z.string(),
  element: z.string(),
  race: z.string(),
  modelPath: z.string(),
  modelScale: z.number().optional().default(1.0),
  camera: z.object({
    position: z.object({
      x: z.number().optional().default(2),
      y: z.number().optional().default(2),
      z: z.number().optional().default(4)
    }).optional(),
    lookAt: z.object({
      x: z.number().optional().default(0),
      y: z.number().optional().default(0),
      z: z.number().optional().default(0)
    }).optional()
  }).optional(),
  author: userRefSchema,
  stats: monsterStatsSchema,
  behaviors: z.array(z.string()),
  drops: z.array(monsterDropSchema),
  spawning: spawningInfoSchema,
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  isDeleted: z.boolean().default(false),
  createdAt: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val.toISOString() : val),
  updatedAt: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val.toISOString() : val)
}).transform((doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  excerpt: doc.excerpt,
  category: doc.category,
  element: doc.element,
  race: doc.race,
  modelPath: doc.modelPath,
  modelScale: doc.modelScale,
  camera: doc.camera,
  author: doc.author,
  stats: doc.stats,
  behaviors: doc.behaviors,
  drops: doc.drops,
  spawning: doc.spawning,
  tags: doc.tags,
  status: doc.status,
  isDeleted: doc.isDeleted,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
}))

// Export the inferred type from the transformed schema
export type DexMonster = z.infer<typeof MongoDexMonsterSchema>

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const dexCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().max(500, 'Description too long'),
  icon: z.string(),
  order: z.number().min(0)
})

export type DexCategory = z.infer<typeof dexCategorySchema>