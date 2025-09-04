import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * GET /api/blog/categories
 * Get blog categories
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }: { dal: typeof DAL }) => {
    try {
      const categories = await dal.blog.getCategories()
      return ApiResponse.success(categories, 'Blog categories retrieved successfully')
    } catch (error) {
      console.error('Failed to get blog categories:', error)
      return ApiResponse.error('Failed to get blog categories', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)