import DexPage from '@/app/dex/DexPage'
import type { DexMonster, DexStats } from '@/lib/types'

// Server-side data fetching function (consistent pattern)
async function getDexData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {    
    // Fetch all data in parallel (consistent with blog/forum/wiki)
    const [monstersRes, categoriesRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/dex/monsters`, { 
        next: { 
          revalidate: 10, // Revalidate every 10 seconds
          tags: ['dex-monsters'] // Cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/dex/categories`, { 
        next: { 
          revalidate: 300, // Keep 5 minutes for categories (rarely change)
          tags: ['dex-categories'] // Cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/dex/stats`, { 
        next: { 
          revalidate: 60, // 1 minute for stats
          tags: ['dex-stats'] // Cache tag for targeted revalidation
        }
      })
    ])
    
    const [monstersData, categoriesData, statsData] = await Promise.all([
      monstersRes.ok ? monstersRes.json() : { success: false, data: [], error: `HTTP ${monstersRes.status}` },
      categoriesRes.ok ? categoriesRes.json() : { success: false, data: [], error: `HTTP ${categoriesRes.status}` },
      statsRes.ok ? statsRes.json() : { success: false, data: null, error: `HTTP ${statsRes.status}` }
    ])
    
    // Log errors only if they occur
    if (!monstersData.success) {
      console.error('Failed to fetch dex monsters:', monstersData.error)
    }

    // Handle response formats consistently (use module-specific response key)
    const monsters: DexMonster[] = monstersData.success 
      ? (monstersData.data?.dexMonsters || [])
      : []
    const categories = categoriesData.success ? categoriesData.data : []

    // Calculate stats from monsters if stats API fails
    const stats: DexStats = statsData.success && statsData.data ? statsData.data : {
      // Base stats (from StatsResponse)
      totalPosts: monsters.length,
      totalViews: monsters.reduce((sum, monster) => sum + (monster.stats?.viewsCount || 0), 0),
      totalLikes: monsters.reduce((sum, monster) => sum + (monster.stats?.likesCount || 0), 0),
      totalShares: monsters.reduce((sum, monster) => sum + (monster.stats?.sharesCount || 0), 0),
      totalUsers: new Set(monsters.map(monster => monster.author?.id || monster.author?.name)).size,
      activeUsers: 0,
      categoriesCount: new Set(monsters.map(monster => monster.category)).size,
      // Dex-specific stats
      totalMonsters: monsters.length,
      totalDrafts: 0,
      monstersCountByCategory: monsters.reduce((acc, monster) => {
        acc[monster.category] = (acc[monster.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      categories: categories.map((cat: any) => ({
        name: cat.name,
        slug: cat.slug,
        postsCount: cat.stats?.postsCount || 0,
        order: cat.order
      })),
      popularPosts: [...monsters]
        .sort((a, b) => (b.stats?.viewsCount || 0) - (a.stats?.viewsCount || 0))
        .slice(0, 5)
        .map(monster => ({
          title: monster.name,
          slug: monster.slug,
          viewsCount: monster.stats?.viewsCount || 0,
          likesCount: monster.stats?.likesCount || 0
        })),
      recentPosts: monsters.slice(0, 5).map(monster => ({
        title: monster.name,
        slug: monster.slug,
        viewsCount: monster.stats?.viewsCount || 0,
        createdAt: monster.createdAt || new Date().toISOString()
      })),
    }
    

    return { monsters, categories, stats }
  } catch (error) {
    console.error('Error fetching dex data:', error)
    return {
      monsters: [],
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
        // DexStats-specific properties
        totalMonsters: 0,
        totalDrafts: 0,
        monstersCountByCategory: {},
        categories: [],
        popularPosts: [],
        recentPosts: []
      } as DexStats
    }
  }
}

export default async function Dex() {
  const { monsters, categories, stats } = await getDexData()

  return (
    <DexPage 
      initialMonsters={monsters}
      initialCategories={categories}
      initialStats={stats}
    />
  )
}