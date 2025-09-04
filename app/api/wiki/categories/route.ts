import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * GET /api/wiki/categories
 * Get wiki categories
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }: { dal: typeof DAL }) => {
    try {
      const categories = await dal.wiki.getCategories()
      return ApiResponse.success(categories, 'Wiki categories retrieved successfully')
    } catch (error) {
      console.error('Failed to get wiki categories:', error)
      return ApiResponse.error('Failed to get wiki categories', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)