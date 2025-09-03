import { ApiResponse } from '@/lib/utils/validation'
import { withDALAndValidation } from '@/lib/database/middleware'

export const GET = withDALAndValidation(
  async (request, { dal }) => {
    const categories = await dal.blog.getCategories()
    return ApiResponse.success(categories, 'Categories fetched successfully')
  }
)