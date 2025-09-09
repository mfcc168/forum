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
  blogSlugSchema,
  type UpdateBlogPostData,
  type BlogSlugData,
  validateBlogContent
} from '@/lib/schemas/blog'
import { generateBlogMetaDescription } from '@/lib/utils/meta'
import { generateSlug, generateSlugWithCounter } from '@/lib/utils/slug'

// Path parameter type imported from schema for consistency

// GET - Fetch single blog post by slug
export const GET = withDALAndValidation(
  async (request: NextRequest, { dal, user, params }: { dal: typeof DAL; user?: ServerUser; params: Promise<BlogSlugData> }) => {
    try {
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
      
      return ApiResponse.success({ blogPost: transformedPost })
    } catch (error) {
      console.error('Blog post GET error:', error)
      return ApiResponse.error('Internal server error', 500)
    }
  },
  {
    schema: blogSlugSchema,
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

    const { slug } = await params

    // Get current blog post to check permissions
    const currentPost = await dal.blog.getPostBySlug(slug)
    
    if (!currentPost) {
      return ApiResponse.error('Blog post not found', 404)
    }

    // Check blog post edit permissions using centralized system
    // @ts-expect-error - Database object structure compatible with permission types
    if (!PermissionChecker.canEdit(user, 'blog', currentPost)) {
      return ApiResponse.error('Only admins can edit blog posts', 403)
    }

    // Additional content validation
    if (validatedData.content) {
      const contentValidation = validateBlogContent(validatedData.content)
      if (!contentValidation.isValid) {
        return ApiResponse.error('Content validation failed', 400, contentValidation.errors)
      }
    }

    // Generate new slug if title changed
    let newSlug = slug
    if (validatedData.title && validatedData.title !== currentPost.title) {
      const baseSlug = generateSlug(validatedData.title)
      newSlug = baseSlug
      let counter = 1
      
      // Ensure slug uniqueness by checking existing posts (but skip the current one)
      while (await dal.blog.findOne({ slug: newSlug, id: { $ne: currentPost.id } })) {
        newSlug = generateSlugWithCounter(baseSlug, counter)
        counter++
      }
    }

    // Prepare update data with flexible typing for slug
    const updateData: Partial<UpdateBlogPostData & { slug?: string }> = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (newSlug !== slug) updateData.slug = newSlug
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

    // Revalidate the cache for both old and new slugs
    revalidateTag(`blog-post-${slug}`)
    if (newSlug !== slug) {
      revalidateTag(`blog-post-${newSlug}`)
    }
    revalidateTag('blog-posts')

    // Get the updated post using the new slug
    const updatedPost = await dal.blog.getPostBySlug(newSlug, user.id, true)

    return ApiResponse.success(
      { 
        blogPost: updatedPost,
        slugChanged: newSlug !== slug,
        newSlug: newSlug !== slug ? newSlug : undefined
      },
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

    const { slug } = await params

    // Get current blog post to check permissions
    const currentPost = await dal.blog.getPostBySlug(slug)
    
    if (!currentPost) {
      return ApiResponse.error('Blog post not found', 404)
    }

    // Check blog post delete permissions using centralized system
    // @ts-expect-error - Database object structure compatible with permission types
    if (!PermissionChecker.canDelete(user, 'blog', currentPost)) {
      return ApiResponse.error('Only admins can delete blog posts', 403)
    }

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
    schema: blogSlugSchema,
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)

