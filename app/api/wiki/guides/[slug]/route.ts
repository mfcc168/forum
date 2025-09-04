import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import { statsManager } from '@/lib/database/stats'
import { PermissionChecker } from '@/lib/utils/permissions'
import type { ServerUser } from "@/lib/types"
import { revalidateTag } from 'next/cache'
import { 
  updateWikiGuideSchema,
  type UpdateWikiGuideData,
  type WikiSlugData
} from '@/lib/schemas/wiki'
import { generateWikiMetaDescription } from '@/lib/utils/meta'

export const runtime = 'nodejs'

// GET - Fetch single wiki guide by slug (consistent with blog post)
export const GET = withDALAndValidation(
  async (request: NextRequest, { user, params, dal }: { user?: ServerUser; params: Promise<WikiSlugData>; dal: typeof DAL }) => {
    try {
      const { slug } = await params

      // Get guide using DAL
      const guide = await dal.wiki.getGuideBySlug(slug, user?.id)

      if (!guide) {
        return ApiResponse.error('Guide not found', 404)
      }

      // Check if user can view this guide (non-published guides require permissions)
      if (guide.status !== 'published' && (!user || !PermissionChecker.canViewDrafts(user, 'wiki'))) {
        return ApiResponse.error('Guide not found', 404)
      }

      // Increment view count if not already viewed by this user (consistent with blog/forum)
      if (user) {
        await statsManager.recordWikiView(user.id, guide.id)
      } else {
        // For anonymous users, increment view count directly
        await dal.wiki.incrementWikiViewCount(guide.id)
      }

      return ApiResponse.success({ guide: guide })
    } catch (error) {
      console.error('Wiki guide GET error:', error)
      return ApiResponse.error('Internal server error', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)

// PUT - Update wiki guide (consistent with blog/forum pattern)
export const PUT = withDALAndValidation(
  async (request: NextRequest, { user, params, validatedData, dal }: { user?: ServerUser; params: Promise<WikiSlugData>; validatedData: UpdateWikiGuideData; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }
    
    const { slug } = await params
    
    // Get current wiki guide to check permissions
    const currentGuide = await dal.wiki.getGuideBySlug(slug)
    
    if (!currentGuide) {
      return ApiResponse.error('Guide not found', 404)
    }
    
    // Check wiki guide edit permissions using centralized system
    if (!PermissionChecker.canEdit(user, 'wiki', currentGuide)) {
      return ApiResponse.error('Only admins can edit wiki guides', 403)
    }
    
    // Extended interface to include metaDescription for proper type safety
    interface ExtendedUpdateData extends UpdateWikiGuideData {
      metaDescription?: string
    }

    // Prepare update data with proper typing
    const updateData: Partial<ExtendedUpdateData> = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.excerpt !== undefined) updateData.excerpt = validatedData.excerpt
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.difficulty !== undefined) updateData.difficulty = validatedData.difficulty
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    
    // Auto-generate metaDescription from excerpt or content
    if (validatedData.excerpt || validatedData.content) {
      updateData.metaDescription = generateWikiMetaDescription(
        validatedData.content || '', 
        validatedData.excerpt
      )
    }
    
    // Update the wiki guide using DAL (finds by slug regardless of status)
    const success = await dal.wiki.updateGuide(slug, updateData, user.id)
    
    if (!success) {
      return ApiResponse.error('Guide not found', 404)
    }
    
    // Revalidate the cache for this specific wiki guide
    revalidateTag(`wiki-guide-${slug}`)
    revalidateTag('wiki-guides')
    revalidateTag('wiki-stats')
    revalidateTag('wiki-categories')
    
    // Get the updated guide for consistent response format (include all statuses for admin)
    const updatedGuide = await dal.wiki.getGuideBySlug(slug, user.id, true)
    
    return ApiResponse.success(
      { guide: updatedGuide },
      'Guide updated successfully'
    )
  },
  {
    schema: updateWikiGuideSchema,
    auth: 'required',
    rateLimit: { requests: 10, window: '1m' }
  }
)

// DELETE - Delete wiki guide (consistent with blog/forum pattern)
export const DELETE = withDALAndValidation(
  async (request: NextRequest, { user, params, dal }: { user?: ServerUser; params: Promise<WikiSlugData>; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }
    
    const { slug } = await params
    
    // Get current wiki guide to check permissions
    const currentGuide = await dal.wiki.getGuideBySlug(slug)
    
    if (!currentGuide) {
      return ApiResponse.error('Guide not found', 404)
    }
    
    // Check wiki guide delete permissions using centralized system
    if (!PermissionChecker.canDelete(user, 'wiki', currentGuide)) {
      return ApiResponse.error('Only admins can delete wiki guides', 403)
    }
    
    // Delete the wiki guide using DAL (soft delete for consistency)
    const success = await dal.wiki.deleteGuide(slug)
    
    if (!success) {
      return ApiResponse.error('Guide not found', 404)
    }
    
    // Revalidate cache
    revalidateTag(`wiki-guide-${slug}`)
    revalidateTag('wiki-guides')
    revalidateTag('wiki-stats')
    revalidateTag('wiki-categories')
    
    return ApiResponse.success(
      null,
      'Guide deleted successfully'
    )
  },
  {
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)