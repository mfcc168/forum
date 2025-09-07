/**
 * Dex (Monster) Validation Schemas
 * 
 * Zod schemas for validating monster data, following the same patterns
 * as wiki, blog, and forum schemas.
 */

import { z } from 'zod'
import { 
  htmlContentSchema,
  titleSchema,
  optionalExcerptSchema,
  metaDescriptionSchema,
  tagsSchema,
  statusSchema,
  defaultStatusSchema,
  userRefSchema,
  baseStatsSchema,
  categoryStringSchema,
  baseQuerySchema,
  mongoIdTransform
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
  worlds: z.array(z.string()).min(1, 'At least one world is required'),
  biomes: z.array(z.string()).min(1, 'At least one biome is required'),
  structures: z.array(z.string()),
  lightLevel: z.object({
    min: z.number().min(0).max(15),
    max: z.number().min(0).max(15)
  }),
  timeOfDay: z.enum(['day', 'night', 'any']),
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
  description: htmlContentSchema,
  excerpt: optionalExcerptSchema,
  category: categoryStringSchema,
  modelPath: z.string().min(1, 'Model path is required'),
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
  description: htmlContentSchema,
  excerpt: optionalExcerptSchema.default(''),
  category: categoryStringSchema,
  element: z.string().min(1, 'Element is required'),
  race: z.string().min(1, 'Race is required'),
  modelPath: z.string().min(1, 'Model path is required'),
  behaviors: z.array(z.string()).default([]),
  health: z.string().min(1, 'Health is required'),
  damage: z.string().min(1, 'Damage is required'),
  xpDrop: z.string().min(1, 'XP drop is required'),
  worlds: z.array(z.string()).min(1, 'At least one world is required'),
  biomes: z.array(z.string()).min(1, 'At least one biome is required'),
  structures: z.array(z.string()).default([]),
  lightLevelMin: z.string().min(1, 'Light level min is required'),
  lightLevelMax: z.string().min(1, 'Light level max is required'),
  timeOfDay: z.enum(['day', 'night', 'any']),
  spawnRate: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  tags: tagsSchema,
  status: defaultStatusSchema
})

export const flatDexUpdateSchema = flatDexFormSchema.partial()

// ============================================================================
// FILTER SCHEMAS (for query validation)
// ============================================================================

export const dexFiltersSchema = z.object({
  category: z.string().optional(),
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
  description: z.string(),
  excerpt: z.string(),
  category: z.string(),
  modelPath: z.string(),
  author: userRefSchema,
  stats: monsterStatsSchema,
  behaviors: z.array(z.string()),
  drops: z.array(monsterDropSchema),
  spawning: spawningInfoSchema,
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  isDeleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
}).transform((doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  excerpt: doc.excerpt,
  category: doc.category,
  modelPath: doc.modelPath,
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