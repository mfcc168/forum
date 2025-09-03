import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse, paginationSchema } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import type { ServerUser } from "@/lib/types"

export const runtime = 'nodejs'

const getRepliesQuerySchema = paginationSchema
// GET - Fetch replies for a post by slug
export const GET = withDALAndValidation(
  async (request: NextRequest, { validatedData, params, dal }: { user?: ServerUser; validatedData: z.infer<typeof getRepliesQuerySchema>; params: Promise<{ slug: string }>; dal: typeof DAL }) => {
    const { slug } = await params
    const { page, limit } = validatedData
    
    // First get the post to retrieve its ID
    const post = await dal.forum.getPostBySlug(slug)
    if (!post) {
      return ApiResponse.error('Post not found', 404)
    }

    // Get replies using DAL with proper pagination
    const result = await dal.forum.getReplies(post.id, { page, limit })

    return ApiResponse.success(result)
  },
  {
    schema: getRepliesQuerySchema,
    auth: 'optional',
    rateLimit: { requests: 100, window: '1m' }
  }
)

const createReplySchema = z.object({
  content: z.string().min(1, 'Reply content is required').max(5000, 'Reply content must be less than 5000 characters'),
  replyToId: z.string().optional().refine(val => !val || /^[0-9a-fA-F]{24}$/.test(val), 'Invalid reply ID')
})

// POST - Create new reply for a post by slug
export const POST = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, params, dal }: { user?: ServerUser; validatedData: z.infer<typeof createReplySchema>; params: Promise<{ slug: string }>; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params
    const { content, replyToId } = validatedData

    // First get the post to retrieve its ID
    const post = await dal.forum.getPostBySlug(slug)
    if (!post) {
      return ApiResponse.error('Post not found', 404)
    }

    // Create reply using DAL
    const replyId = await dal.forum.createReply({
      postId: post.id,
      content: content.trim(),
      authorId: user.id,
      authorName: user.name || 'Unknown User',
      authorAvatar: user.avatar,
      replyToId: replyToId || undefined
    })

    // Get the created reply for consistent response format
    const createdReply = await dal.forum.getReplyById(replyId)
    
    return ApiResponse.success({ reply: createdReply }, 'Reply created successfully')
  },
  {
    schema: createReplySchema,
    auth: 'required',
    rateLimit: { requests: 10, window: '1m' }
  }
)