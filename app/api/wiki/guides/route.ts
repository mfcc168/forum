import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import type { ServerUser, PermissionUser } from "@/lib/types"
import { PermissionChecker } from '@/lib/utils/permissions'
import { revalidateTag } from 'next/cache'
import { 
  createWikiGuideSchema,
  wikiQuerySchema,
  type CreateWikiGuideData,
  type WikiQueryData
} from '@/lib/schemas/wiki'

export const runtime = 'nodejs'

// GET - Fetch wiki guides with enhanced filtering (consistent with blog)
export const GET = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: { user?: ServerUser; validatedData: WikiQueryData; dal: typeof DAL }) => {
    const { page, limit, category, difficulty, search, sortBy, status } = validatedData
    
    // Build filter options
    const permissionUser: PermissionUser | null = user ? { id: user.id, role: user.role } : null
    const filters = {
      category: category && category !== 'all' ? category : undefined,
      difficulty,
      search: search || undefined,
      status: (PermissionChecker.canViewDrafts(permissionUser, 'wiki') ? status : 'published') as 'draft' | 'published' | 'archived'
    }
    
    // Use DAL to get wiki guides with proper pagination (like blog)
    const result = await dal.wiki.getGuides(
      filters,
      { page, limit },
      user?.id
    )
    
    // Guides already in correct format from DAL
    const transformedGuides = result.data
    
    // Return consistent format with pagination and filters (use module-specific key)
    return ApiResponse.success({
      wikiGuides: transformedGuides,
      pagination: result.pagination,
      filters: { category, difficulty, search, sortBy, status }
    })
  },
  {
    schema: wikiQuerySchema,
    auth: 'optional',
    rateLimit: { requests: 50, window: '1m' }
  }
)

// POST - Create new wiki guide with enhanced validation (consistent with blog)
export const POST = withDALAndValidation(
  async (request: NextRequest, { user, validatedData, dal }: { user?: ServerUser; validatedData: CreateWikiGuideData; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }
    
    // Check permissions using centralized system
    const permissionUser: PermissionUser = { id: user.id, role: user.role }
    if (!PermissionChecker.canCreate(permissionUser, 'wiki')) {
      return ApiResponse.error('You do not have permission to create wiki guides', 403)
    }
    

    // Create wiki guide using DAL with automatic slug generation and stats updates
    const excerpt = validatedData.excerpt || validatedData.content.replace(/<[^>]*>/g, '').trim().substring(0, 200)
    
    const guideId = await dal.wiki.createGuide({
      id: '', // Will be set by the DAL
      title: validatedData.title,
      content: validatedData.content,
      excerpt,
      category: validatedData.category,
      difficulty: validatedData.difficulty,
      tags: validatedData.tags || [],
      author: { id: user.id, name: user.name || 'Unknown User', avatar: user.avatar },
      status: validatedData.status || 'published',
      estimatedTime: '10 minutes', // Default
      version: 1
    })
    
    // Get the created guide by ID to get the full guide with stats
    const guide = await dal.wiki.getGuideWithStats(guideId, user.id, true) // Include all statuses
    
    // Revalidate relevant cache tags after creating a wiki guide
    revalidateTag('wiki-guides')
    revalidateTag('wiki-stats')
    revalidateTag('wiki-categories')
    
    return ApiResponse.success(
      { wikiGuide: guide },
      'Wiki guide created successfully'
    )
  },
  {
    schema: createWikiGuideSchema,
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)