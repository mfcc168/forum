import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Database connection diagnostic endpoint
 * GET /api/debug/db
 */
export async function GET(_request: NextRequest) {
  // Debug: Log environment variables to server console
  console.log('=== ENVIRONMENT VARIABLES DEBUG ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI)
  console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0)
  console.log('MONGODB_DB:', process.env.MONGODB_DB)
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
  console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
  console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID)
  console.log('DISCORD_CLIENT_SECRET exists:', !!process.env.DISCORD_CLIENT_SECRET)
  console.log('VERCEL_ENV:', process.env.VERCEL_ENV)
  console.log('VERCEL_URL:', process.env.VERCEL_URL)
  console.log('=====================================')

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? `Set (${process.env.MONGODB_URI.length} chars)` : 'Missing!',
    mongoUriPreview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'Missing!',
    mongoDb: process.env.MONGODB_DB || 'Not set (will use default)',
    nextauthUrl: process.env.NEXTAUTH_URL || 'Missing!',
    nextauthSecret: process.env.NEXTAUTH_SECRET ? `Set (${process.env.NEXTAUTH_SECRET.length} chars)` : 'Missing!',
    discordClientId: process.env.DISCORD_CLIENT_ID || 'Missing!',
    discordClientSecret: process.env.DISCORD_CLIENT_SECRET ? `Set (${process.env.DISCORD_CLIENT_SECRET.length} chars)` : 'Missing!',
    vercelEnv: process.env.VERCEL_ENV || 'Not set',
    vercelUrl: process.env.VERCEL_URL || 'Not set',
    connectionTest: null,
    error: null
  }

  try {
    // Test basic environment
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set')
    }

    // Test MongoDB connection
    const { MongoClient } = await import('mongodb')
    
    const uri = process.env.MONGODB_URI
    const dbName = process.env.MONGODB_DB || 'minecraft_server'
    
    // Parse URI to show safe info
    try {
      const urlObj = new URL(uri)
      diagnostics.connectionInfo = {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        database: dbName,
        hasAuth: !!(urlObj.username && urlObj.password)
      }
    } catch {
      diagnostics.connectionInfo = { error: 'Could not parse URI' }
    }

    // Test connection with timeout
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })

    console.log('Attempting MongoDB connection...')
    
    await client.connect()
    console.log('MongoDB connected successfully')

    const db = client.db(dbName)
    
    // Test basic operations
    const collections = await db.listCollections().toArray()
    diagnostics.connectionTest = {
      status: 'success',
      database: dbName,
      collectionsCount: collections.length,
      collections: collections.map(c => c.name).slice(0, 10) // First 10 collections
    }

    // Test a simple query
    try {
      const testCollection = db.collection('users')
      const count = await testCollection.countDocuments()
      if (diagnostics.connectionTest && typeof diagnostics.connectionTest === 'object') {
        (diagnostics.connectionTest as Record<string, unknown>).testQuery = `Users collection has ${count} documents`
      }
    } catch (queryError) {
      if (diagnostics.connectionTest && typeof diagnostics.connectionTest === 'object') {
        (diagnostics.connectionTest as Record<string, unknown>).testQueryError = queryError instanceof Error ? queryError.message : 'Unknown query error'
      }
    }

    await client.close()

  } catch (error) {
    console.error('Database diagnostic error:', error)
    diagnostics.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }
    diagnostics.connectionTest = { status: 'failed' }
  }

  // Add networking info
  diagnostics.networking = {
    vercelRegion: process.env.VERCEL_REGION || 'unknown',
    vercelUrl: process.env.VERCEL_URL || 'unknown'
  }

  return NextResponse.json({
    success: true,
    data: diagnostics,
    message: 'Database diagnostic completed',
    timestamp: new Date().toISOString()
  })
}