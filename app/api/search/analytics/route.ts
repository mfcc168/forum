import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/validation'
import { z } from 'zod'

export const runtime = 'nodejs'

// Analytics event interfaces
interface SearchAnalyticsEvent {
  query: string
  resultCount: number
  clickedResults: string[]
  searchTime: number
  userId?: string
  timestamp: string
  sessionId: string
  filters?: {
    modules?: string[]
    authors?: string[]
    categories?: string[]
    tags?: string[]
  }
}

interface ClickAnalyticsEvent {
  query: string
  resultId: string
  position: number
  timestamp: string
  sessionId: string
  userId?: string
  resultType?: string
  resultTitle?: string
}

// Type guards for analytics data
interface SearchEventData {
  eventType: 'search'
  query: string
  resultCount: number
  searchTime: number
  sessionId: string
  filters?: Record<string, unknown>
  userAgent?: string
  referer?: string | null
}

interface ClickEventData {
  eventType: 'search_click'
  query: string
  resultId: string
  position: number
  sessionId: string
  resultType?: string
  resultTitle?: string
}

function isSearchEventData(data: unknown): data is SearchEventData {
  return typeof data === 'object' && data !== null && 
         'eventType' in data && (data as any).eventType === 'search'
}

function isClickEventData(data: unknown): data is ClickEventData {
  return typeof data === 'object' && data !== null &&
         'eventType' in data && (data as any).eventType === 'search_click'
}

// ============================================================================
// ANALYTICS VALIDATION SCHEMAS
// ============================================================================

const searchAnalyticsSchema = z.object({
  events: z.array(z.object({
    query: z.string(),
    resultCount: z.number(),
    clickedResults: z.array(z.string()),
    searchTime: z.number(),
    userId: z.string().optional(),
    timestamp: z.string().datetime(),
    sessionId: z.string(),
    filters: z.object({
      modules: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional()
    }).optional()
  }))
})

const clickAnalyticsSchema = z.object({
  query: z.string(),
  resultId: z.string(), 
  position: z.number(),
  timestamp: z.string().datetime(),
  sessionId: z.string(),
  userId: z.string().optional()
})

// ============================================================================
// SEARCH ANALYTICS API
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = searchAnalyticsSchema.parse(body)

    // Store analytics events
    await storeAnalyticsEvents(validatedData.events, request)

    return ApiResponse.success({ 
      stored: validatedData.events.length,
      message: 'Analytics events stored successfully' 
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid analytics data', 400, {
        validation: error.errors
      })
    }
    
    return ApiResponse.error('Failed to store analytics', 500)
  }
}

// ============================================================================
// CLICK TRACKING API  
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = clickAnalyticsSchema.parse(body)

    // Store click event
    await storeClickEvent(validatedData, request)

    return ApiResponse.success({ 
      message: 'Click event tracked successfully' 
    })

  } catch (error) {
    console.error('Click tracking error:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid click data', 400, {
        validation: error.errors
      })
    }
    
    return ApiResponse.error('Failed to track click', 500)
  }
}

// ============================================================================
// ANALYTICS STORAGE FUNCTIONS
// ============================================================================

async function storeAnalyticsEvents(events: SearchAnalyticsEvent[], request?: NextRequest) {
  try {
    const { DAL } = await import('@/lib/database/dal')
    
    // Store each search event as analytics metric
    const promises = events.map(event => {
      return DAL.analytics.createMetric({
        type: 'api-call',
        data: {
          eventType: 'search',
          query: event.query,
          resultCount: event.resultCount,
          searchTime: event.searchTime,
          sessionId: event.sessionId,
          filters: event.filters || {},
          userAgent: request?.headers.get('user-agent') || 'unknown',
          referer: request?.headers.get('referer') || null
        },
        timestamp: typeof event.timestamp === 'string' ? new Date(event.timestamp).getTime() : (event.timestamp || Date.now()),
        userAgent: request?.headers.get('user-agent') || null,
        ip: request ? getClientIP(request) : 'unknown'
      })
    })

    await Promise.all(promises)
    
    // Update popular queries cache
    updatePopularQueries(events)
    
    console.log(`Stored ${events.length} search analytics events in database`)
  } catch (error) {
    console.error('Failed to store search analytics events:', error)
    // Don't throw error to avoid affecting search functionality
  }
}

async function storeClickEvent(clickEvent: ClickAnalyticsEvent, request?: NextRequest) {
  try {
    const { DAL } = await import('@/lib/database/dal')
    
    // Store click event as analytics metric
    await DAL.analytics.createMetric({
      type: 'api-call',
      data: {
        eventType: 'search_click',
        query: clickEvent.query,
        resultId: clickEvent.resultId,
        position: clickEvent.position,
        sessionId: clickEvent.sessionId,
        resultType: clickEvent.resultType,
        resultTitle: clickEvent.resultTitle
      },
      timestamp: typeof clickEvent.timestamp === 'string' ? new Date(clickEvent.timestamp).getTime() : (clickEvent.timestamp || Date.now()),
      userAgent: request?.headers.get('user-agent') || null,
      ip: request ? getClientIP(request) : 'unknown'
    })
    
    console.log('Stored search click event in database:', {
      query: clickEvent.query,
      resultId: clickEvent.resultId,
      position: clickEvent.position
    })
  } catch (error) {
    console.error('Failed to store search click event:', error)
    // Don't throw error to avoid affecting search functionality
  }
}

function updatePopularQueries(events: SearchAnalyticsEvent[]) {
  // In-memory cache update (in production, use Redis or database)
  events.forEach(event => {
    if (event.query && event.resultCount > 0) {
      // Track popular queries for suggestions
      // This could be stored in a separate popular_queries collection
    }
  })
}

// ============================================================================
// ANALYTICS UTILITIES
// ============================================================================

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

// Example analytics dashboard query functions (for admin use)
export async function getSearchAnalytics(timeRange: { from: Date; to: Date }) {
  try {
    const { DAL } = await import('@/lib/database/dal')
    
    // Get search analytics from the analytics collection
    const searchMetrics = await DAL.analytics.getMetrics({
      type: 'api-call',
      startDate: timeRange.from,
      endDate: timeRange.to,
      limit: 10000 // Get all search events in range
    })
    
    // Filter for search events only
    const searchEvents = searchMetrics.metrics.filter(metric => 
      metric.data && isSearchEventData(metric.data)
    )
    
    const clickEvents = searchMetrics.metrics.filter(metric =>
      metric.data && isClickEventData(metric.data)
    )
    
    // Calculate analytics
    const totalSearches = searchEvents.length
    const totalClicks = clickEvents.length
    const clickThroughRate = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0
    
    // Popular queries
    const queryCount: Record<string, number> = {}
    searchEvents.forEach(event => {
      if (event.data && isSearchEventData(event.data)) {
        const query = event.data.query
        if (query) {
          queryCount[query] = (queryCount[query] || 0) + 1
        }
      }
    })
    
    const popularQueries = Object.entries(queryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))
    
    return {
      totalSearches,
      totalClicks,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10,
      uniqueQueries: Object.keys(queryCount).length,
      popularQueries,
      averageResultsCount: searchEvents.length > 0 
        ? searchEvents.reduce((sum, event) => {
            if (event.data && isSearchEventData(event.data)) {
              return sum + (event.data.resultCount || 0)
            }
            return sum
          }, 0) / searchEvents.length
        : 0
    }
  } catch (error) {
    console.error('Failed to get search analytics:', error)
    return {
      totalSearches: 0,
      totalClicks: 0,
      clickThroughRate: 0,
      uniqueQueries: 0,
      popularQueries: [],
      averageResultsCount: 0
    }
  }
}