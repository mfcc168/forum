import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'

// GET /api/dex/categories - Get dex categories
export const GET = withDALAndValidation(
  async (request: NextRequest, { dal }: {
    user?: ServerUser;
    dal: typeof DAL;
  }) => {
    const categories = await dal.dex.getCategories()

    return ApiResponse.success({ categories }, 'Categories retrieved successfully')
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)