import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { z } from 'zod'
import type { ServerUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'
import { revalidateTag } from 'next/cache'

// Interaction validation schema
const interactionSchema = z.object({
  action: z.enum(['like', 'bookmark', 'share', 'view'])
})

// POST /api/dex/monsters/[slug]/interactions - Handle monster interactions
export const POST = withDALAndValidation(
  async (request: NextRequest, { 
    user, 
    validatedData, 
    dal,
    params 
  }: {
    user?: ServerUser
    validatedData: z.infer<typeof interactionSchema>
    dal: typeof DAL
    params: Promise<{ slug: string }>
  }) => {
    // Authentication required for interactions
    if (!user) {
      return ApiResponse.error('Authentication required to interact with monsters', 401)
    }

    const { slug } = await params
    const { action } = validatedData

    try {
      // Get the monster first to ensure it exists
      const monster = await dal.dex.getMonsterWithStats(slug, user.id)
      if (!monster) {
        return ApiResponse.error('Monster not found', 404)
      }

      // Record the interaction
      const result = await dal.dex.recordInteraction(user.id, monster.id, action)

      // Revalidate relevant cache tags
      revalidateTag(`dex-monster-${slug}`)
      revalidateTag('dex-monsters')
      revalidateTag('dex-stats')

      return ApiResponse.success({
        action: result.action,
        currentState: result.currentState,
        ...(result.stats && { stats: result.stats })
      }, `Monster ${action} ${result.action}!`)

    } catch (error) {
      console.error(`Error handling dex monster interaction:`, error)
      return ApiResponse.error(
        `Failed to ${action} monster. Please try again.`,
        500
      )
    }
  },
  {
    schema: interactionSchema,
    auth: 'required',
    rateLimit: { requests: 30, window: '1m' } // Allow frequent interactions
  }
)