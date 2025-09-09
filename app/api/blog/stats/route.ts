import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * GET /api/blog/stats
 * Get blog statistics using DAL pattern (consistent with forum/wiki)
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }: { dal: typeof DAL }) => {
    try {
      const stats = await dal.blog.getStats()
      return ApiResponse.success(stats, 'Blog statistics retrieved successfully')
    } catch (error) {
      console.error('Failed to get blog stats:', error)
      return ApiResponse.error('Failed to get blog statistics', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)