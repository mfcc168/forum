import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Basic test endpoint working',
    timestamp: new Date().toISOString()
  })
}