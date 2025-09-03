import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import clientPromise from '@/lib/database/connection/mongodb'

export const runtime = 'nodejs'

// Metric schema for validation
const metricSchema = z.object({
  type: z.enum(['web-vital', 'route-performance', 'error', 'bundle', 'api-call', 'cache']),
  data: z.record(z.unknown()),
  timestamp: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = metricSchema.parse(body)
    
    const client = await clientPromise
    const db = client.db('minecraft_server')
    
    // Store metric in analytics collection
    const analyticsDoc = {
      ...validatedData,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      createdAt: new Date(validatedData.timestamp)
    }
    
    await db.collection('analytics').insertOne(analyticsDoc)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Analytics error:', error)
    // Return success to avoid affecting user experience
    return NextResponse.json({ success: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    const client = await clientPromise
    const db = client.db('minecraft_server')
    
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
    
    return NextResponse.json({
      success: true,
      data: analytics,
      total: analytics.length
    })
    
  } catch (error) {
    console.error('Analytics retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}