/**
 * Dex (Monster) React Query Hooks
 * 
 * Provides data fetching and caching for monster-related operations.
 * Follows the same patterns as useWiki, useForum, and useBlog hooks.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import type { 
  DexMonster, 
  DexStats, 
  DexCategory, 
  DexFilters,
  PaginatedResponse 
} from '@/lib/types'
import { useQueryState } from '@/lib/hooks/useQueryState'

// ============================================================================
// MONSTER DATA FETCHING
// ============================================================================

export interface UseDexOptions {
  category?: string
  status?: 'draft' | 'published' | 'archived'
  author?: string
  tags?: string[]
  search?: string
  spawnRate?: 'common' | 'uncommon' | 'rare' | 'legendary'
  biome?: string
  world?: string
  structure?: string
  page?: number
  limit?: number
  sortBy?: 'latest' | 'popular' | 'views' | 'name'
  enabled?: boolean
}

/**
 * Hook to fetch paginated monsters with filters
 */
export function useDex(options: UseDexOptions = {}) {
  const { enabled = true, ...filters } = options
  
  const queryResult = useQuery({
    queryKey: ['dex-monsters', filters],
    queryFn: async (): Promise<PaginatedResponse<DexMonster>> => {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/dex/monsters?${params}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch monsters')
      }
      
      return {
        data: result.data?.monsters || [],
        pagination: result.data?.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000     // 10 minutes
  })

  return useQueryState(queryResult)
}

/**
 * Hook to fetch infinite monsters (for infinite scrolling)
 */
export function useInfiniteDexMonsters(filters: Omit<UseDexOptions, 'page' | 'enabled'> & { enabled?: boolean } = {}) {
  const { enabled = true, ...otherFilters } = filters
  
  return useQuery({
    queryKey: ['dex-monsters-infinite', otherFilters],
    queryFn: async () => {
      // For now, just return the first page - can implement proper infinite scrolling later
      const params = new URLSearchParams()
      
      Object.entries(otherFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/dex/monsters?${params}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch monsters')
      }
      
      return result.data?.monsters || []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  })
}

/**
 * Hook to fetch single monster by slug
 */
export function useDexMonster(slug: string, enabled = true) {
  const queryResult = useQuery({
    queryKey: ['dex-monster', slug],
    queryFn: async (): Promise<DexMonster | null> => {
      if (!slug) return null
      
      const response = await fetch(`/api/dex/monsters/${slug}`)
      const result = await response.json()
      
      if (!result.success) {
        if (response.status === 404) {
          return null
        }
        throw new Error(result.error || 'Failed to fetch monster')
      }
      
      return result.data?.monster || null
    },
    enabled: enabled && !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  })

  return useQueryState(queryResult)
}

// ============================================================================
// MONSTER CATEGORIES
// ============================================================================

/**
 * Hook to fetch dex categories
 */
export function useDexCategories() {
  const queryResult = useQuery({
    queryKey: ['dex-categories'],
    queryFn: async (): Promise<DexCategory[]> => {
      const response = await fetch('/api/dex/categories')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }
      
      return result.data?.categories || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })

  return useQueryState(queryResult)
}

// ============================================================================
// MONSTER STATISTICS
// ============================================================================

/**
 * Hook to fetch dex statistics
 */
export function useDexStats() {
  const queryResult = useQuery({
    queryKey: ['dex-stats'],
    queryFn: async (): Promise<DexStats> => {
      const response = await fetch('/api/dex/stats')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dex statistics')
      }
      
      return result.data || {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalUsers: 0,
        activeUsers: 0,
        categoriesCount: 0,
        totalMonsters: 0,
        totalDrafts: 0,
        monstersCountByCategory: {},
        categories: [],
        popularPosts: [],
        recentPosts: []
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000     // 30 minutes
  })

  return useQueryState(queryResult)
}

/**
 * Hook to fetch popular monsters
 */
export function usePopularDexMonsters(limit = 5) {
  const queryResult = useQuery({
    queryKey: ['dex-popular-monsters', limit],
    queryFn: async (): Promise<DexMonster[]> => {
      const response = await fetch(`/api/dex/monsters?sortBy=popular&limit=${limit}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch popular monsters')
      }
      
      return result.data?.monsters || []
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  })

  return useQueryState(queryResult)
}

// ============================================================================
// MONSTER INTERACTIONS
// ============================================================================

/**
 * Hook to handle monster interactions (like, bookmark, share)
 */
export function useDexMonsterInteraction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      slug, 
      action 
    }: { 
      slug: string
      action: 'like' | 'bookmark' | 'share'
    }) => {
      const response = await fetch(`/api/dex/monsters/${slug}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update interaction')
      }
      
      return result
    },
    onSuccess: (data, variables) => {
      // Update monster cache
      queryClient.invalidateQueries({ queryKey: ['dex-monster', variables.slug] })
      queryClient.invalidateQueries({ queryKey: ['dex-monsters'] })
      queryClient.invalidateQueries({ queryKey: ['dex-stats'] })
      
      // Show success message based on action
      const actionName = variables.action === 'like' ? 'liked' : 
                        variables.action === 'bookmark' ? 'bookmarked' : 'shared'
      toast.success(`Monster ${actionName} successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update interaction')
    }
  })
}

// ============================================================================
// MODEL MANAGEMENT
// ============================================================================

/**
 * Hook to fetch available GLTF models for admin use
 */
export function useDexModels() {
  const queryResult = useQuery({
    queryKey: ['dex-models'],
    queryFn: async (): Promise<Array<{ value: string; label: string; disabled?: boolean }>> => {
      const response = await fetch('/api/dex/models')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch models')
      }
      
      return result.data?.models?.map((model: any) => ({
        value: model.path,
        label: model.displayName,
        disabled: false
      })) || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - models don't change often
    gcTime: 30 * 60 * 1000     // 30 minutes
  })

  return useQueryState(queryResult)
}

// ============================================================================
// ADMIN OPERATIONS (Future expansion)
// ============================================================================

/**
 * Hook to create new monster (admin only)
 */
export function useCreateDexMonster() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (flatFormData: any) => {
      // Transform flat form data to nested structure expected by API
      const transformedData = {
        name: flatFormData.name,
        description: flatFormData.description,
        excerpt: flatFormData.excerpt,
        category: flatFormData.category,
        modelPath: flatFormData.modelPath,
        behaviors: Array.isArray(flatFormData.behaviors) ? flatFormData.behaviors : [],
        drops: [], // Empty for now
        spawning: {
          worlds: Array.isArray(flatFormData.worlds) ? flatFormData.worlds : [],
          biomes: Array.isArray(flatFormData.biomes) ? flatFormData.biomes : [],
          structures: Array.isArray(flatFormData.structures) ? flatFormData.structures : [],
          lightLevel: {
            min: parseInt(flatFormData.lightLevelMin, 10) || 0,
            max: parseInt(flatFormData.lightLevelMax, 10) || 15
          },
          timeOfDay: flatFormData.timeOfDay || 'any',
          spawnRate: flatFormData.spawnRate || 'common'
        },
        tags: Array.isArray(flatFormData.tags) ? flatFormData.tags : [],
        stats: {
          health: parseInt(flatFormData.health, 10) || 20,
          damage: parseInt(flatFormData.damage, 10) || 5,
          speed: parseFloat(flatFormData.speed) || 1.0,
          xpDrop: parseInt(flatFormData.xpDrop, 10) || 5
        },
        status: flatFormData.status || 'published'
      }

      const response = await fetch('/api/dex/monsters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create monster')
      }
      
      return result.data?.monster
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dex-monsters'] })
      queryClient.invalidateQueries({ queryKey: ['dex-stats'] })
      toast.success('Monster created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create monster')
    }
  })
}

/**
 * Hook to update existing monster (admin only)
 */
export function useUpdateDexMonster() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      slug, 
      data: flatFormData 
    }: { 
      slug: string
      data: any
    }) => {
      // Transform flat form data to nested structure expected by API
      const transformedData = {
        name: flatFormData.name,
        description: flatFormData.description,
        excerpt: flatFormData.excerpt,
        category: flatFormData.category,
        modelPath: flatFormData.modelPath,
        behaviors: Array.isArray(flatFormData.behaviors) ? flatFormData.behaviors : [],
        drops: [], // Empty for now
        spawning: {
          worlds: Array.isArray(flatFormData.worlds) ? flatFormData.worlds : [],
          biomes: Array.isArray(flatFormData.biomes) ? flatFormData.biomes : [],
          structures: Array.isArray(flatFormData.structures) ? flatFormData.structures : [],
          lightLevel: {
            min: parseInt(flatFormData.lightLevelMin, 10) || 0,
            max: parseInt(flatFormData.lightLevelMax, 10) || 15
          },
          timeOfDay: flatFormData.timeOfDay || 'any',
          spawnRate: flatFormData.spawnRate || 'common'
        },
        tags: Array.isArray(flatFormData.tags) ? flatFormData.tags : [],
        stats: {
          health: parseInt(flatFormData.health, 10) || 20,
          damage: parseInt(flatFormData.damage, 10) || 5,
          speed: parseFloat(flatFormData.speed) || 1.0,
          xpDrop: parseInt(flatFormData.xpDrop, 10) || 5
        },
        status: flatFormData.status || 'published'
      }

      const response = await fetch(`/api/dex/monsters/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update monster')
      }
      
      return result.data?.monster
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dex-monster', variables.slug] })
      queryClient.invalidateQueries({ queryKey: ['dex-monsters'] })
      queryClient.invalidateQueries({ queryKey: ['dex-stats'] })
      toast.success('Monster updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update monster')
    }
  })
}

/**
 * Hook to delete monster (admin only)
 */
export function useDeleteDexMonster() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await fetch(`/api/dex/monsters/${slug}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete monster')
      }
      
      return result
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dex-monster', variables] })
      queryClient.invalidateQueries({ queryKey: ['dex-monsters'] })
      queryClient.invalidateQueries({ queryKey: ['dex-stats'] })
      toast.success('Monster deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete monster')
    }
  })
}