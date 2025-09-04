import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'

export const runtime = 'nodejs'

// Metric schema for validation
const metricSchema = z.object({
  type: z.enum(['web-vital', 'route-performance', 'error', 'bundle', 'api-call', 'cache']),
  data: z.record(z.unknown()),
  timestamp: z.number()
})

// Query schema for GET requests
const analyticsQuerySchema = z.object({
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100)
})

/**
 * POST /api/analytics/metrics
 * Store analytics metrics
 */
export const POST = withDALAndValidation(
  async (request: NextRequest, { validatedData }: { validatedData: z.infer<typeof metricSchema> }) => {
    try {
      // Store metric in analytics collection via DAL
      const analyticsDoc = {
        ...validatedData,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        createdAt: new Date(validatedData.timestamp)
      }
      
      // For now, store via direct collection access since no DAL method exists
      // TODO: Create DAL.analytics.createMetric() method
      const { db } = await import('@/lib/database/connection').then(m => m.connectToDatabase())
      await db.collection('analytics').insertOne(analyticsDoc)
      
      return ApiResponse.success(null, 'Metric stored successfully')
      
    } catch (error) {
      console.error('Analytics error:', error)
      // Return success to avoid affecting user experience for analytics
      return ApiResponse.success(null, 'Metric processed')
    }
  },
  {
    schema: metricSchema,
    auth: 'optional',
    rateLimit: { requests: 100, window: '1m' }
  }
)

/**
 * GET /api/analytics/metrics
 * Retrieve analytics metrics (admin only)
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { validatedData, user }: { 
    validatedData: z.infer<typeof analyticsQuerySchema>;
    user?: ServerUser;
  }) => {
    // Only admins can view analytics
    if (!user || user.role !== 'admin') {
      return ApiResponse.error('Admin access required', 403)
    }

    try {
      const { type, startDate, endDate, limit } = validatedData
      
      // TODO: Create DAL.analytics.getMetrics() method
      const { db } = await import('@/lib/database/connection').then(m => m.connectToDatabase())
      
      // Build query filter
      const filter: Record<string, unknown> = {}
      
      if (type) {
        filter.type = type
      }
      
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      
      // Get analytics data
      const analytics = await db
        .collection('analytics')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
      
      return ApiResponse.success({
        metrics: analytics,
        total: analytics.length,
        filters: { type, startDate, endDate, limit }
      }, 'Analytics metrics retrieved successfully')
      
    } catch (error) {
      console.error('Analytics retrieval error:', error)
      return ApiResponse.error('Failed to retrieve analytics metrics', 500)
    }
  },
  {
    schema: analyticsQuerySchema,
    auth: 'required',
    rateLimit: { requests: 30, window: '1m' }
  }
)