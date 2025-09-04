import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * GET /api/forum/stats
 * Get forum statistics using DAL pattern (consistent with blog/wiki)
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }: { dal: typeof DAL }) => {
    try {
      const stats = await dal.forum.getStats()
      return ApiResponse.success(stats, 'Forum statistics retrieved successfully')
    } catch (error) {
      console.error('Failed to get forum stats:', error)
      return ApiResponse.error('Failed to get forum statistics', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)