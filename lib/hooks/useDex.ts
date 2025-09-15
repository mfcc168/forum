/**
 * Dex-Specific Hooks
 * 
 * Lightweight wrapper around generic content hooks with dex-specific functionality.
 */

import { dexHooks, type UseContentOptions, type UseInfiniteContentOptions } from './useContent'
import { useQuery } from '@tanstack/react-query'
import type { DexCategory, DexStats, DexMonster } from '@/lib/types'

// Re-export for use in config files
export { dexHooks }

// ============================================================================
// DEX-SPECIFIC OPTIONS
// ============================================================================

export interface UseDexOptions extends UseContentOptions<'dex'> {
  category?: string
  element?: 'none' | 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark' | 'ice' | 'lightning'
  race?: 'god' | 'dragon' | 'goblin' | 'orc' | 'elf' | 'dwarf' | 'troll' | 'giant' | 'undead' | 'skeleton' | 'zombie' | 'vampire' | 'ghost' | 'demon' | 'angel' | 'fairy' | 'phoenix' | 'beast' | 'wolf' | 'bear' | 'cat' | 'bird' | 'fish' | 'snake' | 'spider' | 'insect' | 'slime' | 'golem' | 'construct' | 'robot' | 'elemental' | 'plant' | 'humanoid' | 'alien' | 'void'
  spawnRate?: 'common' | 'uncommon' | 'rare' | 'legendary'
  biome?: string
  world?: string
  structure?: string
  sortBy?: 'latest' | 'popular' | 'views' | 'name'
}

// ============================================================================
// MAIN DEX HOOKS
// ============================================================================

/**
 * Fetch dex monsters with filtering and pagination
 */
export function useDexMonsters(options: UseDexOptions = {}) {
  return dexHooks.useContent(options)
}

/**
 * Infinite scrolling dex monsters
 */
export function useInfiniteDexMonsters(options: Omit<UseDexOptions, 'page'> = {}) {
  return dexHooks.useInfiniteContent(options as UseInfiniteContentOptions<'dex'>)
}

/**
 * Fetch single dex monster by slug
 */
export function useDexMonster(slug: string, options: { 
  enabled?: boolean; 
  initialData?: DexMonster;
  refetchOnMount?: boolean;
  staleTime?: number;
} = {}) {
  return dexHooks.useContentItem(slug, options)
}

// ============================================================================
// DEX CRUD OPERATIONS
// ============================================================================

/**
 * Create dex monster
 */
export function useCreateDexMonster() {
  return dexHooks.useCreateContent()
}

/**
 * Update dex monster
 */
export function useUpdateDexMonster() {
  return dexHooks.useUpdateContent()
}

/**
 * Delete dex monster
 */
export function useDeleteDexMonster() {
  return dexHooks.useDeleteContent()
}

// ============================================================================
// DEX INTERACTIONS
// ============================================================================

/**
 * Handle dex monster interactions (like, bookmark, share, favorite)
 */
export function useDexMonsterInteraction() {
  return dexHooks.useContentInteraction()
}

// ============================================================================
// DEX METADATA HOOKS
// ============================================================================

/**
 * Fetch dex categories
 */
export function useDexCategories(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: ['dex-categories'],
    queryFn: async (): Promise<DexCategory[]> => {
      const response = await fetch('/api/dex/categories')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dex categories')
      }
      
      return result.data || []
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Fetch dex statistics
 */
export function useDexStats(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: ['dex-stats'],
    queryFn: async (): Promise<DexStats> => {
      const response = await fetch('/api/dex/stats')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dex stats')
      }
      
      return result.data || {}
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Fetch available 3D models for monster creation
 */
export function useDexModels(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: ['dex-models'],
    queryFn: async (): Promise<Array<{ value: string; label: string; disabled?: boolean }>> => {
      const response = await fetch('/api/dex/models')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dex models')
      }
      
      // API now returns the formatted options directly
      return result.data || []
    },
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

// ============================================================================
// POPULAR/RECENT DEX CONTENT
// ============================================================================

/**
 * Fetch popular dex monsters
 */
export function usePopularDexMonsters(options: { enabled?: boolean; limit?: number } = {}) {
  const { enabled = true, limit = 10 } = options
  
  return useQuery({
    queryKey: ['popular-dex-monsters', limit],
    queryFn: async (): Promise<DexMonster[]> => {
      const response = await fetch(`/api/dex/monsters?sortBy=popular&limit=${limit}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch popular monsters')
      }
      
      return result.data?.dexMonsters || []
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })
}

/**
 * Fetch recent dex monsters
 */
export function useRecentDexMonsters(options: { enabled?: boolean; limit?: number } = {}) {
  const { enabled = true, limit = 10 } = options
  
  return useQuery({
    queryKey: ['recent-dex-monsters', limit],
    queryFn: async (): Promise<DexMonster[]> => {
      const response = await fetch(`/api/dex/monsters?sortBy=latest&limit=${limit}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recent monsters')
      }
      
      return result.data?.dexMonsters || []
    },
    enabled,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000     // 15 minutes
  })
}

// Legacy aliases for backward compatibility (remove these after migration)
export const useDex = useDexMonsters