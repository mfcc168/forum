import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import type { ServerUser, PermissionUser } from "@/lib/types"
import { PermissionChecker } from '@/lib/utils/permissions'
import { revalidateTag } from 'next/cache'
import { 
  createBlogPostSchema, 
  blogQuerySchema,
  type CreateBlogPostData,
  type BlogQueryData
} from '@/lib/schemas/blog'
import { generateSlug } from '@/lib/utils/slug'
import { generateBlogMetaDescription } from '@/lib/utils/meta'

// GET - Fetch blog posts with enhanced filtering
export const GET = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: { user?: ServerUser; validatedData: BlogQueryData; dal: typeof DAL }) => {
    const { page, limit, category, search, sortBy, status } = validatedData
    
    // Build filter options
    const filters = {
      category: category && category !== 'all' ? category : undefined,
      search: search || undefined,
      sortBy,
      status
    }
    
    // Use DAL to get blog posts with proper pagination (like forum)
    const result = await dal.blog.getPosts(
      filters,
      { page, limit },
      user?.id
    )
    
    // Posts already in correct format from DAL
    const transformedPosts = result.data
    
    // Return consistent format with pagination and filters (use module-specific key)
    return ApiResponse.success({
      blogPosts: transformedPosts,
      pagination: result.pagination,
      filters: { category, search, sortBy, status }
    })
  },
  {
    schema: blogQuerySchema,
    auth: 'optional',
    rateLimit: { requests: 50, window: '1m' }
  }
)

// POST - Create new blog post with enhanced validation (admin only)
export const POST = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: { user?: ServerUser; validatedData: CreateBlogPostData; dal: typeof DAL }) => {
    
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }
    
    // Check permissions using centralized system
    const permissionUser: PermissionUser = { id: user.id, role: user.role }
    if (!PermissionChecker.canCreate(permissionUser, 'blog')) {
      return ApiResponse.error('You do not have permission to create blog posts', 403)
    }
    

    // Create blog post using DAL with automatic stats updates
    const generatedSlug = generateSlug(validatedData.title)
    const metaDescription = generateBlogMetaDescription(validatedData.content, validatedData.excerpt)
    
    // Create the post
    await dal.blog.createPost({
      id: '', // Will be set by DAL
      title: validatedData.title,
      content: validatedData.content,
      excerpt: validatedData.excerpt || validatedData.content.replace(/<[^>]*>/g, '').trim().substring(0, 200),
      category: validatedData.category,
      slug: generatedSlug,
      tags: validatedData.tags || [],
      author: { id: user.id, name: user.name || 'Unknown User', avatar: user.avatar },
      status: validatedData.status || 'published',
      metaDescription,
      featuredImage: validatedData.featuredImage
    })
    
    // Get the actual post with proper lookup using the generated slug
    const post = await dal.blog.getPostBySlug(generatedSlug, user.id)
    
    // Revalidate relevant cache tags after creating a blog post
    revalidateTag('blog-posts')
    revalidateTag('blog-stats')
    revalidateTag('blog-categories')
    
    return ApiResponse.success(
      { blogPost: post },
      'Blog post created successfully'
    )
  },
  {
    schema: createBlogPostSchema,
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)

// Removed - using generateBlogSlug from schemas

