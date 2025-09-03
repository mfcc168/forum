import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import { statsManager } from '@/lib/database/stats'
import { PermissionChecker } from '@/lib/utils/permissions'
import type { ServerUser } from "@/lib/types"
import { updateForumPostSchema, type UpdatePostData } from '@/lib/schemas/forum'
import { revalidateTag } from 'next/cache'
import { generateForumMetaDescription } from '@/lib/utils/meta'

export const runtime = 'nodejs'

// Path parameter type for slug-based routes
type PostSlugData = {
  slug: string
}

// GET - Fetch single forum post with replies (by slug)
export const GET = withDALAndValidation(
  async (request: NextRequest, { dal, user, params }: { dal: typeof DAL; user?: ServerUser; params: Promise<PostSlugData> }) => {
    try {
      const { slug } = await params

      // Get the forum post with stats using DAL
      const postWithStats = await dal.forum.getPostBySlug(slug, user?.id)
      
      if (!postWithStats) {
        return ApiResponse.error('Post not found', 404)
      }

      // Check if user can view this post (non-published posts require permissions)
      if (postWithStats.status !== 'published' && (!user || !PermissionChecker.canViewDrafts(user, 'forum'))) {
        return ApiResponse.error('Post not found', 404)
      }

      // Increment view count if not already viewed by this user (consistent with blog/wiki)
      if (user) {
        await statsManager.recordForumView(user.id, postWithStats.id)
      } else {
        // For anonymous users, increment view count directly
        await dal.forum.incrementForumViewCount(postWithStats.id)
      }

      // Return just the post (replies should be fetched separately for consistency)
      return ApiResponse.success({
        post: postWithStats
      })
    } catch (error) {
      console.error('Forum post GET error:', error)
      return ApiResponse.error('Internal server error', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// PUT - Update forum post (by slug)
export const PUT = withDALAndValidation(
  async (request: NextRequest, { user, params, validatedData, dal }: { user?: ServerUser; params: Promise<PostSlugData>; validatedData: UpdatePostData; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params

    // Get current post using DAL
    const currentPost = await dal.forum.getPostBySlug(slug)

    if (!currentPost) {
      return ApiResponse.error('Post not found', 404)
    }

    // Check forum post edit permissions using centralized system
    if (!PermissionChecker.canEdit(user, 'forum', currentPost)) {
      return ApiResponse.error('You can only edit your own posts', 403)
    }

    // Update the post using DAL
    const updateData = {
      title: validatedData.title?.trim(),
      content: validatedData.content?.trim(),
      metaDescription: validatedData.content ? generateForumMetaDescription(validatedData.content.trim()) : undefined,
      tags: validatedData.tags || []
    }

    // Remove undefined values
    const cleanUpdateData: Record<string, unknown> = {}
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdateData[key] = value
      }
    })

    await dal.forum.updatePost(slug, cleanUpdateData)

    // Get the updated post with stats
    const updatedPost = await dal.forum.getPostBySlug(slug, user.id)

    if (!updatedPost) {
      return ApiResponse.error('Post not found after update', 404)
    }

    // Revalidate the cache for this specific forum post and its replies
    revalidateTag(`forum-post-${updatedPost.slug}`)
    revalidateTag(`forum-replies-${updatedPost.id}`)

    return ApiResponse.success({
      post: updatedPost
    }, 'Post updated successfully')
  },
  {
    schema: updateForumPostSchema,
    auth: 'required',
    rateLimit: { requests: 10, window: '1m' }
  }
)

// DELETE - Delete forum post (by slug)
export const DELETE = withDALAndValidation(
  async (request: NextRequest, { user, params, dal }: { user?: ServerUser; params: Promise<PostSlugData>; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { slug } = await params

    // Get current post using DAL
    const currentPost = await dal.forum.getPostBySlug(slug)

    if (!currentPost) {
      return ApiResponse.error('Post not found', 404)
    }

    // Check forum post delete permissions using centralized system
    if (!PermissionChecker.canDelete(user, 'forum', currentPost)) {
      return ApiResponse.error('You can only delete your own posts', 403)
    }

    // Delete the post using DAL
    const deleteResult = await dal.forum.deletePost(slug)
    
    if (!deleteResult) {
      return ApiResponse.error('Failed to delete post', 500)
    }

    // Revalidate the cache for this specific forum post and general forum data
    revalidateTag(`forum-post-${slug}`)
    revalidateTag(`forum-replies-${currentPost.id}`)
    revalidateTag('forum-posts')
    revalidateTag('forum-stats')

    return ApiResponse.success(null, 'Post deleted successfully')
  },
  {
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)