import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { z } from 'zod'
import type { ServerUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'
import { statsManager } from '@/lib/database/stats'

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