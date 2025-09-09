import { NextResponse } from 'next/server'

/**
 * Basic status endpoint that bypasses all authentication
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is responding'
  })
}