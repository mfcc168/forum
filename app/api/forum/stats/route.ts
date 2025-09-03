import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export async function GET() {
  try {
    const stats = await DAL.forum.getStats()
    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Error fetching forum stats:', error)
    return ApiResponse.error('Failed to fetch forum stats', 500)
  }
}