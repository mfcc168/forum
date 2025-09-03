/**
 * Content interaction API for like, bookmark, share, and helpful actions.
 * Supports forum posts, blog posts, and wiki guides.
 * 
 * @route POST /api/interactions/[type]/[slug] - Record interaction
 * @route GET /api/interactions/[type]/[slug] - Get user interaction state
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { statsManager } from '@/lib/database/stats'
import { ApiResponse } from '@/lib/utils/validation'
import { withDALAndValidation } from '@/lib/database/middleware'
import { DAL } from '@/lib/database/dal'
import type { ServerUser } from '@/lib/types'

export const runtime = 'nodejs'

const paramsSchema = z.object({
  type: z.enum(['forum', 'blog', 'wiki']),
  slug: z.string().min(1)
})

const baseInteractionSchema = z.object({
  action: z.enum(['like', 'bookmark', 'share'])
})

const wikiInteractionSchema = baseInteractionSchema.extend({
  action: z.enum(['like', 'bookmark', 'share', 'helpful'])
})
export const POST = withDALAndValidation(
  async (request: NextRequest, { dal, user, params }: { dal: typeof DAL; user?: ServerUser; params: Promise<{ type: string; slug: string }> }) => {
    const { type, slug } = paramsSchema.parse(await params)
    const body = await request.json()
    const schema = type === 'wiki' ? wikiInteractionSchema : baseInteractionSchema
    const { action } = schema.parse(body)

    let contentId: string
    switch (type) {
      case 'forum':
        const forumPost = await dal.forum.getPostBySlug(slug)
        if (!forumPost) {
          return ApiResponse.error('Forum post not found', 404)
        }
        contentId = forumPost.id
        break
        
      case 'blog':
        const blogPost = await dal.blog.getPostBySlug(slug)
        if (!blogPost) {
          return ApiResponse.error('Blog post not found', 404)
        }
        contentId = blogPost.id
        break
        
      case 'wiki':
        const wikiGuide = await dal.wiki.getGuideBySlug(slug)
        if (!wikiGuide) {
          return ApiResponse.error('Wiki guide not found', 404)
        }
        contentId = wikiGuide.id
        break
        
      default:
        return ApiResponse.error('Invalid content type', 400)
    }

    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    let result
    switch (type) {
      case 'forum':
        result = await statsManager.recordForumInteraction(
          user.id, 
          contentId, 
          action as 'like' | 'bookmark' | 'share'
        )
        break
        
      case 'blog':
        result = await statsManager.recordBlogInteraction(
          user.id, 
          contentId, 
          action as 'like' | 'bookmark' | 'share'
        )
        break
        
      case 'wiki':
        result = await statsManager.recordWikiInteraction(
          user.id, 
          contentId, 
          action as 'like' | 'bookmark' | 'share' | 'helpful'
        )
        break
    }

    // Transform response to match React Query hook expectations
    const responseData = {
      stats: result.stats,
      interactions: result.interactions || {
        isLiked: false,
        isBookmarked: false,
        isShared: false,
        isHelpful: false
      },
      action: result.action // 'added' or 'removed'
    }

    return ApiResponse.success(
      responseData, 
      `${action} ${result.action === 'added' ? 'added' : 'removed'} successfully`
    )

  },
  {
    auth: 'required',
    rateLimit: { requests: 30, window: '1m' }
  }
)

export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal, user, params }: { dal: typeof DAL; user?: ServerUser; params: Promise<{ type: string; slug: string }> }) => {
    if (!user) {
      return ApiResponse.success({
        isLiked: false,
        isBookmarked: false,
        isShared: false,
        isHelpful: false
      })
    }

    const { type, slug } = paramsSchema.parse(await params)
    let contentItem
    switch (type) {
      case 'forum':
        contentItem = await dal.forum.getPostBySlug(slug, user.id)
        break
      case 'blog':
        contentItem = await dal.blog.getPostBySlug(slug, user.id)
        break
      case 'wiki':
        contentItem = await dal.wiki.getGuideBySlug(slug, user.id)
        break
      default:
        return ApiResponse.error('Invalid content type', 400)
    }

    if (!contentItem) {
      return ApiResponse.error(`${type} content not found`, 404)
    }

    return ApiResponse.success(
      contentItem.interactions || {
        isLiked: false,
        isBookmarked: false,
        isShared: false,
        isHelpful: false
      }
    )

  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)