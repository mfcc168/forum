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
  description?: string              // Made optional
  excerpt: string                  // Short description for lists
  category: string                 // Monster category (e.g., 'hostile', 'passive', 'neutral')
  element: string                  // Monster element (e.g., 'fire', 'water', 'earth', 'air', 'dark', 'light')
  race: string                     // Monster race (e.g., 'undead', 'beast', 'dragon', 'humanoid')
  modelPath: string                // Path to GLTF model file
  modelScale?: number              // Custom model scale multiplier
  camera?: {                       // Custom camera positioning
    position?: { x: number; y: number; z: number }
    lookAt?: { x: number; y: number; z: number }
  }
  author: UserRef                  // Creator/contributor
  stats: MonsterStats              // Monster-specific stats
  interactions?: ContentInteractionState  // User interaction state (optional for lists)
  behaviors: string[]              // Monster behaviors
  drops: MonsterDrop[]             // Items this monster drops
  spawning: SpawningInfo           // Required again since worlds is required 
  tags: string[]                   // Searchable tags
  status: 'draft' | 'published' | 'archived'
  isDeleted: boolean
}

export interface MonsterStats extends ContentStats {
  health: number                   // Monster health points
  damage: number                   // Monster damage
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
  worlds: 'overworld' | 'nether' | 'end' | 'magic' | 'heaven' | 'dungeon' // Required select
  biomes?: string[]                 // Made optional
  structures?: string[]             // Already optional
  lightLevel?: {                    // Made optional
    min?: number                    // Made optional
    max?: number                    // Made optional
  }
  timeOfDay?: 'day' | 'night' | 'any' // Made optional
  spawnRate: 'common' | 'uncommon' | 'rare' | 'legendary' // Keep required
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