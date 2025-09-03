import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import { statsManager } from '@/lib/database/stats'
import { PermissionChecker } from '@/lib/utils/permissions'
import type { ServerUser } from "@/lib/types"
import { revalidateTag } from 'next/cache'
import { 
  updateBlogPostSchema, 
  type UpdateBlogPostData,
  validateBlogContent
} from '@/lib/schemas/blog'
import { generateBlogMetaDescription } from '@/lib/utils/meta'

// Path parameter type
type BlogSlugData = {
  slug: string
}

// GET - Fetch single blog post by slug
export const GET = withDALAndValidation(
  async (request: NextRequest, { dal, user, params }: { dal: typeof DAL; user?: ServerUser; params: Promise<BlogSlugData> }) => {
    const { slug } = await params
    
    // Fetch blog post using DAL
    const blogPost = await dal.blog.getPostBySlug(slug, user?.id)
    
    if (!blogPost) {
      return ApiResponse.error('Blog post not found', 404)
    }

    // Check if user can view this blog post (non-published posts require admin)
    if (blogPost.status !== 'published' && (!user || !PermissionChecker.canViewDrafts(user, 'blog'))) {
      return ApiResponse.error('Blog post not found', 404)
    }

    // Increment view count if not already viewed by this user
    if (user) {
      await statsManager.recordBlogView(user.id, blogPost.id)
    } else {
      await dal.blog.incrementBlogViewCount(blogPost.id)
    }

    // Transform to match new type system (BlogPost interface)
    const transformedPost = {
      ...blogPost,
      // Ensure user interactions are properly handled
      ...(user && {
        interactions: {
          isLiked: blogPost.interactions?.isLiked || false,
          isBookmarked: blogPost.interactions?.isBookmarked || false,
          isShared: blogPost.interactions?.isShared || false
        }
      })
    }
    
    return ApiResponse.success({ post: transformedPost })
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// PUT - Update blog post (consistent with wiki/forum pattern)
export const PUT = withDALAndValidation(
  async (request: NextRequest, { user, params, validatedData, dal }: { user?: ServerUser; params: Promise<BlogSlugData>; validatedData: UpdateBlogPostData; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    // Check blog post edit permissions using centralized system
    if (!PermissionChecker.canEdit(user, 'blog')) {
      return ApiResponse.error('Only admins can edit blog posts', 403)
    }

    const { slug } = await params

    // Additional content validation
    if (validatedData.content) {
      const contentValidation = validateBlogContent(validatedData.content)
      if (!contentValidation.isValid) {
        return ApiResponse.error('Content validation failed', 400, contentValidation.errors)
      }
    }

    // Prepare update data
    const updateData: Partial<UpdateBlogPostData> = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.excerpt !== undefined) updateData.excerpt = validatedData.excerpt
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    // Auto-generate metaDescription if content or excerpt changed
    if (validatedData.content || validatedData.excerpt) {
      updateData.metaDescription = generateBlogMetaDescription(
        validatedData.content || '', 
        validatedData.excerpt
      )
    }

    const success = await dal.blog.updatePost(slug, updateData)

    if (!success) {
      return ApiResponse.error('Blog post not found', 404)
    }

    // Revalidate the cache for this specific blog post
    revalidateTag(`blog-post-${slug}`)
    revalidateTag('blog-posts')

    // Get the updated post for consistent response format (include all statuses for admin)
    const updatedPost = await dal.blog.getPostBySlug(slug, user.id, true)

    return ApiResponse.success(
      { post: updatedPost },
      'Blog post updated successfully'
    )
  },
  {
    schema: updateBlogPostSchema,
    auth: 'required',
    rateLimit: { requests: 10, window: '1m' }
  }
)

// DELETE - Delete blog post (consistent with wiki/forum pattern)
export const DELETE = withDALAndValidation(
  async (request: NextRequest, { user, params, dal }: { user?: ServerUser; params: Promise<BlogSlugData>; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    // Check blog post delete permissions using centralized system
    if (!PermissionChecker.canDelete(user, 'blog')) {
      return ApiResponse.error('Only admins can delete blog posts', 403)
    }

    const { slug } = await params

    // Delete the blog post using DAL (soft delete for consistency)
    const success = await dal.blog.deletePost(slug)

    if (!success) {
      return ApiResponse.error('Blog post not found', 404)
    }

    // Revalidate cache
    revalidateTag(`blog-post-${slug}`)
    revalidateTag('blog-posts')

    return ApiResponse.success(
      null,
      'Blog post deleted successfully'
    )
  },
  {
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)

