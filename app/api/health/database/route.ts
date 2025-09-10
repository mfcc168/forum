import { NextRequest, NextResponse } from 'next/server'
import getClientPromise from '@/lib/database/connection/mongodb'

export const runtime = 'nodejs'

// Database health check endpoint
export async function GET(request: NextRequest) {
  console.log('🏥 [Health] Database health check requested')
  
  try {
    // Test 1: Check if environment variables are set
    console.log('1️⃣ [Health] Checking environment variables...')
    const mongoUri = process.env.MONGODB_URI
    const mongoDb = process.env.MONGODB_DB || 'minecraft_server'
    
    if (!mongoUri) {
      console.error('❌ [Health] MONGODB_URI not set')
      return NextResponse.json({
        success: false,
        error: { message: 'MONGODB_URI environment variable not set' }
      }, { status: 500 })
    }
    
    console.log('✅ [Health] Environment variables OK')
    console.log('🔗 [Health] Database name:', mongoDb)
    console.log('🔗 [Health] URI prefix:', mongoUri.substring(0, 20) + '...')

    // Test 2: Try to connect to MongoDB
    console.log('2️⃣ [Health] Testing MongoDB connection...')
    const client = await getClientPromise()
    console.log('✅ [Health] MongoDB client obtained')

    // Test 3: Try to access the database
    console.log('3️⃣ [Health] Testing database access...')
    const db = client.db(mongoDb)
    console.log('✅ [Health] Database object created')

    // Test 4: Try to list collections
    console.log('4️⃣ [Health] Testing collection listing...')
    const collections = await db.listCollections().toArray()
    console.log('✅ [Health] Collections found:', collections.length)
    console.log('📋 [Health] Collection names:', collections.map(c => c.name))

    // Test 5: Try to query a collection (forumPosts)
    console.log('5️⃣ [Health] Testing forumPosts collection query...')
    const forumCollection = db.collection('forumPosts')
    const postCount = await forumCollection.countDocuments()
    console.log('✅ [Health] ForumPosts count:', postCount)

    // Test 6: Try to query another collection (users)
    console.log('6️⃣ [Health] Testing users collection query...')
    const usersCollection = db.collection('users')
    const userCount = await usersCollection.countDocuments()
    console.log('✅ [Health] Users count:', userCount)

    console.log('🎉 [Health] All database tests passed!')

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        mongodb: {
          connected: true,
          database: mongoDb,
          collections: collections.map(c => c.name),
          stats: {
            forumPosts: postCount,
            users: userCount
          }
        },
        timestamp: new Date().toISOString()
      },
      message: 'Database connection healthy'
    })

  } catch (error) {
    console.error('❌ [Health] Database health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Database health check failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 })
  }
}