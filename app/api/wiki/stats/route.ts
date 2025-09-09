import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'

export const runtime = 'nodejs'

/**
 * GET /api/wiki/stats
 * Get wiki statistics
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }) => {
    try {
      const stats = await dal.wiki.getStats()
      return ApiResponse.success(stats, 'Wiki statistics retrieved successfully')
    } catch (error) {
      console.error('Failed to get wiki stats:', error)
      return ApiResponse.error('Failed to get wiki statistics', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)