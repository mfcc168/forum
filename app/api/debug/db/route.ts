import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Database connection diagnostic endpoint
 * GET /api/debug/db
 */
export async function GET(_request: NextRequest) {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoUri: process.env.MONGODB_URI ? 'Set (hidden)' : 'Missing!',
    mongoDb: process.env.MONGODB_DB || 'Not set (will use default)',
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