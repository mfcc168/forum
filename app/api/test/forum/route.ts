import { NextResponse } from 'next/server'
import getClientPromise from '@/lib/database/connection/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  console.log('🧪 [ForumTest] Testing direct forum data access...')
  
  try {
    // Direct database access to test forum posts
    console.log('🔗 [ForumTest] Getting database client...')
    const client = await getClientPromise()
    const db = client.db('minecraft_server')
    
    console.log('📂 [ForumTest] Accessing forumPosts collection...')
    const collection = db.collection('forumPosts')
    
    // Simple find operation
    console.log('🔍 [ForumTest] Executing simple find...')
    const posts = await collection.find({}).limit(3).toArray()
    
    console.log('✅ [ForumTest] Posts found:', posts.length)
    console.log('📄 [ForumTest] First post structure:', posts[0] ? Object.keys(posts[0]) : 'No posts')
    
    return NextResponse.json({
      success: true,
      data: {
        totalPosts: posts.length,
        posts: posts.map(post => ({
          id: post._id,
          title: post.title,
          author: post.author,
          createdAt: post.createdAt,
          stats: post.stats
        }))
      },
      message: 'Direct forum access successful'
    })

  } catch (error) {
    console.error('❌ [ForumTest] Error accessing forum data:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Forum data access failed',
        details: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 })
  }
}