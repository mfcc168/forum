import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Environment variables health check endpoint
export async function GET(request: NextRequest) {
  console.log('🏥 [Health] Environment check requested')
  
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? '***SET***' : 'NOT SET',
      MONGODB_DB: process.env.MONGODB_DB || 'NOT SET (using default)',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '***SET***' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***SET***' : 'NOT SET',
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? '***SET***' : 'NOT SET',
      DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? '***SET***' : 'NOT SET'
    }

    console.log('🔍 [Health] Environment variables:', envVars)

    // Check for critical missing variables
    const criticalVars = ['MONGODB_URI']
    const missing = criticalVars.filter(varName => !process.env[varName])
    
    if (missing.length > 0) {
      console.error('❌ [Health] Missing critical environment variables:', missing)
      return NextResponse.json({
        success: false,
        error: {
          message: 'Missing critical environment variables',
          details: { missing, provided: envVars }
        }
      }, { status: 500 })
    }

    console.log('✅ [Health] All critical environment variables are set')

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        environment: envVars,
        missing: missing,
        timestamp: new Date().toISOString()
      },
      message: 'Environment variables OK'
    })

  } catch (error) {
    console.error('❌ [Health] Environment check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Environment check failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 })
  }
}