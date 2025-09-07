import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import type { ServerUser } from '@/lib/types'

export const runtime = 'nodejs'

/**
 * @swagger
 * /api/wiki/guides/{slug}/interactions:
 *   post:
 *     summary: Record a user interaction with a wiki guide
 *     description: Record user interactions like likes, bookmarks, helpful votes, or shares for a wiki guide
 *     tags: [Wiki]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The guide's unique slug identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [like, bookmark, helpful, share]
 *                 description: The type of interaction to record
 *     responses:
 *       200:
 *         description: Interaction recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isNew:
 *                           type: boolean
 *                           description: Whether this is a new interaction (true) or removal (false)
 *                         guide:
 *                           $ref: '#/components/schemas/WikiGuide'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Guide not found
 *       422:
 *         description: Invalid interaction type
 *       500:
 *         description: Internal server error
 */

// Path parameter type
type WikiSlugData = {
  slug: string
}

// Interaction schema
const interactionSchema = z.object({
  action: z.enum(['like', 'bookmark', 'helpful', 'share'])
})

// POST - Record wiki guide interaction
export const POST = withDALAndValidation(
  async (_request: NextRequest, { user, params, validatedData, dal }: { 
    user?: ServerUser
    params: Promise<WikiSlugData>
    validatedData: z.infer<typeof interactionSchema>
    dal: typeof DAL 
  }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params
    const { action } = validatedData

    // Get the guide first
    const guide = await dal.wiki.getGuideBySlug(slug)
    if (!guide) {
      return ApiResponse.error('Guide not found', 404)
    }

    // Record the interaction using DAL
    const result = await dal.wiki.recordInteraction(
      user.id,
      guide.id,
      action
    )

    // Get updated guide with new stats
    const updatedGuide = await dal.wiki.getGuideBySlug(slug, user.id)

    return ApiResponse.success(
      { 
        isNew: result.isNew,
        guide: updatedGuide
      },
      result.isNew 
        ? `${action.charAt(0).toUpperCase() + action.slice(1)} added`
        : `${action.charAt(0).toUpperCase() + action.slice(1)} removed`
    )
  },
  {
    schema: interactionSchema,
    auth: 'required',
    rateLimit: { requests: 30, window: '1m' }
  }
)