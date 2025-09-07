import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { dexFiltersSchema, createMonsterSchema } from '@/lib/schemas/dex'
import { ApiResponse } from '@/lib/utils/validation'
import { z } from 'zod'
import type { ServerUser, PermissionUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'
import { PermissionChecker } from '@/lib/utils/permissions'
import { revalidateTag } from 'next/cache'

// GET /api/dex/monsters - Get paginated monsters
export const GET = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: {
    user?: ServerUser;
    validatedData: z.infer<typeof dexFiltersSchema>;
    dal: typeof DAL;
  }) => {
    const { page, limit, ...filters } = validatedData

    const result = await dal.dex.getMonsters(
      filters,
      { page, limit },
      user?.id
    )

    return ApiResponse.success({
      dexMonsters: result.data,
      pagination: result.pagination,
      filters
    }, 'Monsters retrieved successfully')
  },
  {
    schema: dexFiltersSchema,
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// POST /api/dex/monsters - Create new monster (admin only)
export const POST = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: {
    user?: ServerUser;
    validatedData: z.infer<typeof createMonsterSchema>;
    dal: typeof DAL;
  }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    // Check permissions using centralized system
    const permissionUser: PermissionUser = { id: user.id, role: user.role }
    if (!PermissionChecker.canCreate(permissionUser, 'dex')) {
      return ApiResponse.error('You do not have permission to create monsters', 403)
    }

    const monsterData = {
      name: validatedData.name,
      description: validatedData.description,
      ...(validatedData.excerpt && { excerpt: validatedData.excerpt }),
      category: validatedData.category,
      modelPath: validatedData.modelPath,
      ...(validatedData.behaviors && { behaviors: validatedData.behaviors }),
      ...(validatedData.drops && { drops: validatedData.drops }),
      spawning: validatedData.spawning,
      ...(validatedData.tags && { tags: validatedData.tags }),
      ...(validatedData.status && { status: validatedData.status }),
      stats: {
        health: validatedData.stats.health,
        damage: validatedData.stats.damage,
        xpDrop: validatedData.stats.xpDrop
      },
      author: {
        id: user.id,
        name: user.name || 'Admin',
        avatar: user.avatar || undefined
      }
    }

    const monsterId = await dal.dex.createMonster(monsterData)
    const createdMonster = await dal.dex.getMonsterWithStats(monsterId, user.id, true)

    // Revalidate relevant cache tags after creating a monster
    revalidateTag('dex-monsters')
    revalidateTag('dex-stats')
    revalidateTag('dex-categories')

    return ApiResponse.success({ 
      dexMonster: createdMonster
    }, 'Monster created successfully')
  },
  {
    schema: createMonsterSchema,
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)