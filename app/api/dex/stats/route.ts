import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'

// GET /api/dex/stats - Get dex statistics
export const GET = withDALAndValidation(
  async (request: NextRequest, { dal }: {
    user?: ServerUser;
    dal: typeof DAL;
  }) => {
    const stats = await dal.dex.getStats()

    return ApiResponse.success(stats, 'Dex statistics retrieved successfully')
  },
  {
    auth: 'optional',
    rateLimit: { requests: 30, window: '1m' }
  }
)