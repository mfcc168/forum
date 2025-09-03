import BlogPage from '@/app/blog/BlogPage'

// Server-side data fetching function
async function getBlogData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Fetch all data in parallel
    const [postsRes, categoriesRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/blog/posts`, { 
        next: { 
          revalidate: 10, // Revalidate every 10 seconds (consistent with forum)
          tags: ['blog-posts'] // Add cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/blog/categories`, { 
        next: { 
          revalidate: 300, // Keep 5 minutes for categories (rarely change)
          tags: ['blog-categories'] // Add cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/blog/stats`, { 
        next: { 
          revalidate: 60, // 1 minute for stats (balance between freshness and performance)
          tags: ['blog-stats'] // Add cache tag for targeted revalidation
        }
      })
    ])

    const [postsData, categoriesData, statsData] = await Promise.all([
      postsRes.ok ? postsRes.json() : { success: false, data: [] },
      categoriesRes.ok ? categoriesRes.json() : { success: false, data: [] },
      statsRes.ok ? statsRes.json() : { success: false, data: { totalPosts: 0, totalViews: 0, categoriesCount: 0, totalUsers: 0, categories: [] } }
    ])

    // Handle different response formats and add debugging
    const posts = postsData.success 
      ? (Array.isArray(postsData.data) ? postsData.data : postsData.data?.posts || [])
      : []
    const categories = categoriesData.success ? categoriesData.data : []
    const stats = statsData.success ? statsData.data : {
      totalPosts: posts.length,
      totalViews: posts.reduce((sum: number, post: { viewCount?: number }) => sum + (post.viewCount || 0), 0),
      totalLikes: 0,
      totalShares: 0,
      totalUsers: new Set(posts.map((post: { authorName: string }) => post.authorName)).size,
      activeUsers: 0,
      categoriesCount: new Set(posts.map((post: { category: string }) => post.category)).size,
      totalDrafts: 0,
      recentPosts: [],
      mostPopular: posts.slice(0, 5), // Use actual posts as most popular fallback
      categories,
      // Member stats (placeholder for now, should come from stats API)
      onlineMembers: 0,
      totalMembers: 0
    }
    

    return {
      posts,
      categories,
      stats
    }
  } catch (error) {
    console.error('Error fetching blog data:', error)
    return {
      posts: [],
      categories: [],
      stats: {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalUsers: 0,
        activeUsers: 0,
        categoriesCount: 0,
        totalDrafts: 0,
        recentPosts: [],
        mostPopular: [],
        categories: []
      }
    }
  }
}

export default async function Blog() {
  const { posts, categories, stats } = await getBlogData()

  return (
    <BlogPage 
      initialPosts={posts}
      initialCategories={categories}
      initialStats={stats}
    />
  )
}