import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  console.log('🧪 [Test] Simple test endpoint called')
  
  const mongoUri = process.env.MONGODB_URI
  
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working',
    hasMongoUri: !!mongoUri,
    timestamp: new Date().toISOString()
  })
}