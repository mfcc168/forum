import WikiPage from '@/app/wiki/WikiPage'
import type { WikiGuide, WikiStats } from '@/lib/types'

// Server-side data fetching function (consistent pattern)
async function getWikiData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Fetch all data in parallel (consistent with blog/forum)
    const [guidesRes, categoriesRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/wiki/guides`, { 
        next: { 
          revalidate: 10, // Revalidate every 10 seconds
          tags: ['wiki-guides'] // Cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/wiki/categories`, { 
        next: { 
          revalidate: 300, // Keep 5 minutes for categories (rarely change)
          tags: ['wiki-categories'] // Cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/wiki/stats`, { 
        next: { 
          revalidate: 60, // 1 minute for stats
          tags: ['wiki-stats'] // Cache tag for targeted revalidation
        }
      })
    ])

    const [guidesData, categoriesData, statsData] = await Promise.all([
      guidesRes.ok ? guidesRes.json() : { success: false, data: [] },
      categoriesRes.ok ? categoriesRes.json() : { success: false, data: [] },
      statsRes.ok ? statsRes.json() : { success: false, data: null }
    ])

    // Handle response formats consistently (use module-specific response key)
    const guides: WikiGuide[] = guidesData.success 
      ? (guidesData.data?.wikiGuides || [])
      : []
    const categories = categoriesData.success ? categoriesData.data : []

    // Calculate stats from guides if stats API fails
    const stats: WikiStats = statsData.success && statsData.data ? statsData.data : {
      // Base stats (from StatsResponse)
      totalPosts: guides.length,
      totalViews: guides.reduce((sum, guide) => sum + (guide.stats?.viewsCount || 0), 0),
      totalLikes: guides.reduce((sum, guide) => sum + (guide.stats?.likesCount || 0), 0),
      totalShares: guides.reduce((sum, guide) => sum + (guide.stats?.sharesCount || 0), 0),
      totalUsers: new Set(guides.map(guide => guide.author?.id || guide.author?.name)).size,
      activeUsers: 0,
      categoriesCount: new Set(guides.map(guide => guide.category)).size,
      // Wiki-specific stats
      totalGuides: guides.length,
      guidesCountByCategory: guides.reduce((acc, guide) => {
        acc[guide.category] = (acc[guide.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      guidesCountByDifficulty: guides.reduce((acc, guide) => {
        const difficulty = guide.difficulty || 'beginner'
        acc[difficulty] = (acc[difficulty] || 0) + 1
        return acc
      }, { beginner: 0, intermediate: 0, advanced: 0 } as Record<'beginner' | 'intermediate' | 'advanced', number>),
      averageHelpfulRating: guides.length > 0 
        ? guides.reduce((sum, guide) => sum + (guide.stats?.helpfulsCount || 0), 0) / guides.length
        : 0,
      mostHelpfulGuides: [...guides]
        .sort((a, b) => (b.stats?.helpfulsCount || 0) - (a.stats?.helpfulsCount || 0))
        .slice(0, 5)
        .map(guide => ({
          title: guide.title,
          slug: guide.slug,
          helpfulsCount: guide.stats?.helpfulsCount || 0,
          difficulty: guide.difficulty || 'beginner'
        })),
      recentGuides: guides.slice(0, 5).map(guide => ({
        title: guide.title,
        slug: guide.slug,
        difficulty: guide.difficulty || 'beginner',
        createdAt: guide.createdAt || new Date().toISOString()
      })),
    }
    

    return { guides, categories, stats }
  } catch (error) {
    console.error('Error fetching wiki data:', error)
    return {
      guides: [],
      categories: [],
      stats: {
        // Base StatsResponse properties
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalUsers: 0,
        activeUsers: 0,
        categoriesCount: 0,
        // WikiStats-specific properties
        totalGuides: 0,
        totalDrafts: 0,
        averageHelpfulRating: 0,
        guidesCountByDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
        categories: [],
        popularPosts: [],
        recentPosts: []
      } as WikiStats
    }
  }
}

export default async function Wiki() {
  const { guides, categories, stats } = await getWikiData()

  return (
    <WikiPage 
      initialGuides={guides}
      initialCategories={categories}
      initialStats={stats}
    />
  )
}