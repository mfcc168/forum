import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { z } from 'zod'
import type { ServerUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'
import { statsManager } from '@/lib/database/stats'
import { PermissionChecker } from '@/lib/utils/permissions'
import { flatDexUpdateSchema } from '@/lib/schemas/dex'
import { revalidateTag } from 'next/cache'
import { generateSlug, generateSlugWithCounter } from '@/lib/utils/slug'

const slugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required')
})

// GET /api/dex/monsters/[slug] - Get single monster by slug
export const GET = withDALAndValidation(
  async (request: NextRequest, { 
    user, 
    params, 
    dal 
  }: {
    user?: ServerUser
    params: Promise<z.infer<typeof slugParamsSchema>>
    dal: typeof DAL
  }) => {
    const { slug } = await params
    const monster = await dal.dex.getMonsterBySlug(slug, user?.id)

    if (!monster) {
      return ApiResponse.error('Monster not found', 404)
    }

    // Record view count
    if (user) {
      await statsManager.recordDexView(user.id, monster.id)
    } else {
      // For anonymous users - increment directly
      await dal.dex.incrementDexViewCount(monster.id)
    }

    return ApiResponse.success({ monster }, 'Monster retrieved successfully')
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// PUT /api/dex/monsters/[slug] - Update monster by slug  
export const PUT = withDALAndValidation(
  async (request: NextRequest, {
    user,
    validatedData,
    params,
    dal
  }: {
    user?: ServerUser
    validatedData: z.infer<typeof flatDexUpdateSchema>
    params: Promise<z.infer<typeof slugParamsSchema>>
    dal: typeof DAL
  }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params

    // Get existing monster to check permissions
    const existingMonster = await dal.dex.getMonsterBySlug(slug)
    if (!existingMonster) {
      return ApiResponse.error('Monster not found', 404)
    }

    // Check permissions using centralized system (admin-only like wiki/blog)
    const permissionUser = { id: user.id, role: user.role }
    // @ts-expect-error - Database object structure compatible with permission types
    if (!PermissionChecker.canEdit(permissionUser, 'dex', existingMonster)) {
      return ApiResponse.error('You do not have permission to edit this monster', 403)
    }

    // Generate new slug if name changed
    let newSlug = slug
    if (validatedData.name && validatedData.name !== existingMonster.name) {
      const baseSlug = generateSlug(validatedData.name)
      newSlug = baseSlug
      let counter = 1
      
      // Ensure slug uniqueness by checking existing monsters (but skip the current one)
      while (await dal.dex.findOne({ slug: newSlug, _id: { $ne: existingMonster.id } })) {
        newSlug = generateSlugWithCounter(baseSlug, counter)
        counter++
      }
    }

    // Transform flat form data to nested monster structure - preserve actual form values
    const updateData: Record<string, unknown> = {}
    
    // Only include fields that were actually provided in the form data
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (newSlug !== slug) updateData.slug = newSlug
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.excerpt !== undefined) updateData.excerpt = validatedData.excerpt
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.element !== undefined) updateData.element = validatedData.element
    if (validatedData.race !== undefined) updateData.race = validatedData.race
    if (validatedData.modelPath !== undefined) updateData.modelPath = validatedData.modelPath
    if (validatedData.modelScale !== undefined) updateData.modelScale = validatedData.modelScale
    if (validatedData.behaviors !== undefined) updateData.behaviors = validatedData.behaviors
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    
    // Handle stats with proper validation - updated for nested object structure (already numbers)
    if (validatedData.stats) {
      const statsUpdate: Record<string, unknown> = {}
      if (validatedData.stats.health !== undefined) {
        statsUpdate.health = validatedData.stats.health
      }
      if (validatedData.stats.damage !== undefined) {
        statsUpdate.damage = validatedData.stats.damage
      }
      if (validatedData.stats.xpDrop !== undefined) {
        statsUpdate.xpDrop = validatedData.stats.xpDrop
      }
      if (Object.keys(statsUpdate).length > 0) {
        updateData.stats = statsUpdate
      }
    }
    
    // Handle spawning data with proper validation - updated for nested object structure  
    if (validatedData.spawning) {
      const spawningUpdate: Record<string, unknown> = {}
      if (validatedData.spawning.worlds !== undefined) spawningUpdate.worlds = validatedData.spawning.worlds
      if (validatedData.spawning.biomes !== undefined) spawningUpdate.biomes = validatedData.spawning.biomes
      if (validatedData.spawning.structures !== undefined) spawningUpdate.structures = validatedData.spawning.structures
      if (validatedData.spawning.timeOfDay !== undefined) spawningUpdate.timeOfDay = validatedData.spawning.timeOfDay
      if (validatedData.spawning.spawnRate !== undefined) spawningUpdate.spawnRate = validatedData.spawning.spawnRate
      
      // Handle light level with proper validation
      const lightLevelUpdate: Record<string, unknown> = {}
      if (validatedData.spawning.lightLevelMin !== undefined && validatedData.spawning.lightLevelMin !== '') {
        const min = parseInt(validatedData.spawning.lightLevelMin)
        if (!isNaN(min)) lightLevelUpdate.min = min
      }
      if (validatedData.spawning.lightLevelMax !== undefined && validatedData.spawning.lightLevelMax !== '') {
        const max = parseInt(validatedData.spawning.lightLevelMax)
        if (!isNaN(max)) lightLevelUpdate.max = max
      }
      if (Object.keys(lightLevelUpdate).length > 0) {
        spawningUpdate.lightLevel = lightLevelUpdate
      }
      
      if (Object.keys(spawningUpdate).length > 0) {
        updateData.spawning = spawningUpdate
      }
    }
    
    // Camera data structure is now working correctly
    
    // Handle 3D camera data with proper validation - nested object structure
    if (validatedData.camera) {
      updateData.camera = validatedData.camera
    }


    const success = await dal.dex.updateMonster(slug, updateData)
    
    if (!success) {
      return ApiResponse.error('Failed to update monster', 500)
    }

    // Get updated monster using the new slug
    const updatedMonster = await dal.dex.getMonsterBySlug(newSlug, user.id)
    
    // Revalidate cache for both old and new slugs
    revalidateTag(`dex-monster-${slug}`)
    if (newSlug !== slug) {
      revalidateTag(`dex-monster-${newSlug}`)
    }
    revalidateTag('dex-monsters')
    revalidateTag('dex-stats')

    return ApiResponse.success({ 
      dexMonster: updatedMonster,
      slugChanged: newSlug !== slug,
      newSlug: newSlug !== slug ? newSlug : undefined
    }, 'Monster updated successfully')
  },
  {
    schema: flatDexUpdateSchema,
    auth: 'required',
    rateLimit: { requests: 10, window: '1m' }
  }
)

// DELETE /api/dex/monsters/[slug] - Delete monster by slug
export const DELETE = withDALAndValidation(
  async (request: NextRequest, { user, params, dal }: { user?: ServerUser; params: Promise<z.infer<typeof slugParamsSchema>>; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params

    // Get current monster to check permissions
    const currentMonster = await dal.dex.getMonsterBySlug(slug)
    
    if (!currentMonster) {
      return ApiResponse.error('Monster not found', 404)
    }

    // Check monster delete permissions using centralized system
    const permissionUser = { id: user.id, role: user.role }
    // @ts-expect-error - Database object structure compatible with permission types
    if (!PermissionChecker.canDelete(permissionUser, 'dex', currentMonster)) {
      return ApiResponse.error('Only admins can delete monsters', 403)
    }

    // Delete the monster using DAL (soft delete for consistency)
    const success = await dal.dex.deleteMonster(slug)

    if (!success) {
      return ApiResponse.error('Monster not found', 404)
    }

    // Revalidate cache
    revalidateTag(`dex-monster-${slug}`)
    revalidateTag('dex-monsters')
    revalidateTag('dex-stats')

    return ApiResponse.success(
      null,
      'Monster deleted successfully'
    )
  },
  {
    schema: slugParamsSchema,
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)