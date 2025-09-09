import { NextResponse } from 'next/server'

/**
 * Simple environment variable diagnostic endpoint
 * GET /api/debug/env
 */
export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Missing',
    mongoDb: process.env.MONGODB_DB || 'Missing',
    nextauthUrl: process.env.NEXTAUTH_URL || 'Missing',
    nextauthSecret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    discordClientId: process.env.DISCORD_CLIENT_ID || 'Missing',
    discordClientSecret: process.env.DISCORD_CLIENT_SECRET ? 'Set' : 'Missing',
    vercelUrl: process.env.VERCEL_URL || 'Missing',
    vercelEnv: process.env.VERCEL_ENV || 'Missing'
  })
}