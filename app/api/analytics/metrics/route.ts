import { NextRequest } from 'next/server'
import { z } from 'zod'
import { DAL } from '@/lib/database/dal'
import { ApiResponse } from '@/lib/utils/validation'
import { getServerUser } from '@/lib/auth/server'

export const runtime = 'nodejs'

// Metric schema for validation
const metricSchema = z.object({
  type: z.enum(['web-vital', 'route-performance', 'error', 'bundle', 'api-call', 'cache']),
  data: z.record(z.unknown()),
  timestamp: z.number()
})

/**
 * POST /api/analytics/metrics
 * Store analytics metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = metricSchema.parse(body)
    
    // Create analytics document
    const analyticsDoc = {
      type: validatedData.type,
      data: validatedData.data,
      timestamp: validatedData.timestamp,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
          request.headers.get('x-real-ip') || 
          'unknown'
    }
    
    // Store metric using DAL
    await DAL.analytics.createMetric(analyticsDoc)
    
    return ApiResponse.success(null, 'Metric stored successfully')
    
  } catch (error) {
    console.error('Analytics error:', error)
    // Return success to avoid affecting user experience for analytics
    return ApiResponse.success(null, 'Metric processed')
  }
}

/**
 * GET /api/analytics/metrics
 * Retrieve analytics metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser()
    if (!user || user.role !== 'admin') {
      return ApiResponse.error('Admin access required', 403)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const startDate = searchParams.get('startDate') 
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // Get analytics data using DAL
    const result = await DAL.analytics.getMetrics({
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit
    })
    
    return ApiResponse.success(result, 'Analytics data retrieved successfully')
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return ApiResponse.error('Failed to fetch analytics data', 500)
  }
}