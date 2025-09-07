/**
 * Dex (Monster) Entity Types
 * 
 * Defines the data structures for monster/creature entities in the dex system.
 * Follows the same patterns as wiki/blog/forum entities.
 */

import type { Entity, UserRef, ContentStats, ContentInteractionState } from './base'

// ============================================================================
// DEX MONSTER ENTITY
// ============================================================================

export interface DexMonster extends Entity {
  name: string                      // Monster name
  slug: string                      // URL-safe identifier 
  description: string              // Monster description
  excerpt: string                  // Short description for lists
  category: string                 // Monster category (e.g., 'hostile', 'passive', 'neutral')
  modelPath: string                // Path to GLTF model file
  author: UserRef                  // Creator/contributor
  stats: MonsterStats              // Monster-specific stats
  behaviors: string[]              // Monster behaviors
  drops: MonsterDrop[]             // Items this monster drops
  spawning: SpawningInfo           // Where/when the monster spawns  
  tags: string[]                   // Searchable tags
  status: 'draft' | 'published' | 'archived'
  isDeleted: boolean
}

export interface MonsterStats extends ContentStats {
  health: number                   // Monster health points
  damage: number                   // Monster damage
  speed: number                    // Movement speed
  xpDrop: number                   // Experience points dropped
}

export interface MonsterDrop {
  itemName: string
  dropChance: number               // 0-1 probability
  minQuantity: number
  maxQuantity: number
  isRare: boolean
}

export interface SpawningInfo {
  worlds: string[]                 // Which worlds it spawns in (overworld, nether, end, etc.)
  biomes: string[]                 // Where it spawns
  structures: string[]             // Specific structures where it spawns
  lightLevel: {
    min: number
    max: number
  }
  timeOfDay: 'day' | 'night' | 'any'
  spawnRate: 'common' | 'uncommon' | 'rare' | 'legendary'
}

// ============================================================================
// DEX CATEGORY
// ============================================================================

export interface DexCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  order: number
  stats?: {
    postsCount: number
    totalViews: number
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// DEX STATISTICS  
// ============================================================================

export interface DexStats {
  // Base stats (consistent with other modules)
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalUsers: number
  activeUsers: number
  categoriesCount: number

  // Dex-specific stats
  totalMonsters: number
  totalDrafts: number
  monstersCountByCategory: Record<string, number>
  categories: Array<{
    name: string
    slug: string
    postsCount: number
    order: number
  }>
  popularPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    likesCount: number
  }>
  recentPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    createdAt: string
  }>
}

// ============================================================================
// QUERY INTERFACES
// ============================================================================

export interface DexFilters {
  category?: string
  status?: 'draft' | 'published' | 'archived'
  author?: string
  tags?: string[]
  search?: string
  spawnRate?: 'common' | 'uncommon' | 'rare' | 'legendary'
  biome?: string
  world?: string
  structure?: string
  sortBy?: 'latest' | 'popular' | 'views' | 'name'
}

// ============================================================================
// MONSTER INTERACTION STATE
// ============================================================================

export interface MonsterInteractionState extends ContentInteractionState {
  // Dex-specific interactions could be added here
  isFavorited?: boolean           // User's favorite monsters
}