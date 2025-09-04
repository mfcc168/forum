import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * GET /api/forum/categories
 * Get forum categories
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }: { dal: typeof DAL }) => {
    try {
      const categories = await dal.forum.getCategories()
      return ApiResponse.success(categories, 'Forum categories retrieved successfully')
    } catch (error) {
      console.error('Failed to get forum categories:', error)
      return ApiResponse.error('Failed to get forum categories', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)