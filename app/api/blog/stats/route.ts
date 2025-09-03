import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/database/connection'
import type { BlogStats } from '@/lib/types'

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Get blog statistics
    const [statsResult, categoriesResult] = await Promise.all([
      // Main stats
      db.collection('blogPosts').aggregate([
        { $match: { status: 'published', isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
            totalCategories: { $addToSet: '$category' },
            totalAuthors: { $addToSet: '$authorName' }
          }
        },
        {
          $project: {
            _id: 0,
            totalPosts: 1,
            totalViews: 1,
            totalCategories: { $size: '$totalCategories' },
            totalAuthors: { $size: '$totalAuthors' }
          }
        }
      ]).toArray(),
      
      // Categories with post counts (exclude null categories)
      db.collection('blogPosts').aggregate([
        { $match: { status: 'published', isDeleted: { $ne: true }, category: { $ne: null } } },
        {
          $group: {
            _id: '$category',
            postCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            slug: '$_id',
            description: '',
            postCount: 1
          }
        },
        { $sort: { postCount: -1 } }
      ]).toArray()
    ])

    const stats = statsResult[0] || {
      totalPosts: 0,
      totalViews: 0,
      totalCategories: 0,
      totalAuthors: 0
    }

    const enrichedCategories = categoriesResult.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      postCount: cat.postCount,
      description: getCategoryDescription(cat.name)
    }))

    const blogStats: BlogStats = {
      // Base StatsResponse properties
      totalPosts: stats.totalPosts,
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes || 0,
      totalShares: stats.totalShares || 0,
      totalUsers: stats.totalUsers || stats.totalAuthors || 0,
      activeUsers: stats.activeUsers || 0,
      categoriesCount: stats.categoriesCount || stats.totalCategories || enrichedCategories.length,
      // BlogStats-specific properties
      totalDrafts: stats.totalDrafts || 0,
      recentPosts: stats.recentPosts || [],
      mostPopular: stats.mostPopular || []
    }

    return NextResponse.json({
      success: true,
      data: blogStats
    })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog stats' },
      { status: 500 }
    )
  }
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'announcement': 'Important server announcements and news',
    'update': 'Server updates and feature releases',
    'guide': 'Helpful guides and tutorials',
    'event': 'Community events and activities',
    'community': 'Community highlights and stories'
  }
  
  return descriptions[category] || `Posts about ${category}`
}