import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import type { ServerUser } from '@/lib/types'
import type { BlogSlugData } from '@/lib/schemas/blog'

export const runtime = 'nodejs'

/**
 * @swagger
 * /api/blog/posts/{slug}/interactions:
 *   post:
 *     summary: Record a user interaction with a blog post
 *     description: Record user interactions like likes, bookmarks, or shares for a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The post's unique slug identifier
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
 *                 enum: [like, bookmark, share]
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
 *                         post:
 *                           $ref: '#/components/schemas/BlogPost'
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Post not found
 *       422:
 *         description: Invalid interaction type
 *       500:
 *         description: Internal server error
 */

// Path parameter type imported from schema for consistency

// Interaction schema
const interactionSchema = z.object({
  action: z.enum(['like', 'bookmark', 'share'])
})

// POST - Record blog post interaction
export const POST = withDALAndValidation(
  async (_request: NextRequest, { user, params, validatedData, dal }: { 
    user?: ServerUser
    params: Promise<BlogSlugData>
    validatedData: z.infer<typeof interactionSchema>
    dal: typeof DAL 
  }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params
    const { action } = validatedData

    // Get the post first
    const post = await dal.blog.getPostBySlug(slug)
    if (!post) {
      return ApiResponse.error('Post not found', 404)
    }

    // Record the interaction using DAL
    const result = await dal.blog.recordInteraction(
      user.id,
      post.id,
      'post',
      action
    )

    // Get updated post with new stats
    const updatedPost = await dal.blog.getPostBySlug(slug, user.id)

    return ApiResponse.success(
      { 
        isNew: result.isNew,
        blogPost: updatedPost
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