import ForumPage from '@/app/forum/ForumPage'

// Server-side data fetching function
async function getForumData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Fetch all data in parallel
    const [postsRes, categoriesRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/forum/posts`, { 
        next: { 
          revalidate: 10, // Revalidate every 10 seconds for consistency
          tags: ['forum-posts'] // Add cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/forum/categories`, { 
        next: { 
          revalidate: 300, // Keep 5 minutes for categories (rarely change)
          tags: ['forum-categories'] // Add cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/forum/stats`, { 
        next: { 
          revalidate: 60, // 1 minute for stats (balance between freshness and performance)
          tags: ['forum-stats'] // Add cache tag for targeted revalidation
        }
      })
    ])

    const [postsData, categoriesData, statsData] = await Promise.all([
      postsRes.ok ? postsRes.json() : { success: false, data: { posts: [] } },
      categoriesRes.ok ? categoriesRes.json() : { success: false, data: [] },
      statsRes.ok ? statsRes.json() : { success: false, data: { totalTopics: 0, totalPosts: 0, totalMembers: 0, onlineMembers: 0, categories: [] } }
    ])

    // Handle different response formats and add debugging
    const posts = postsData.success 
      ? (Array.isArray(postsData.data) ? postsData.data : postsData.data?.posts || [])
      : []
    

    return {
      posts,
      categories: categoriesData.success ? categoriesData.data : [],
      stats: statsData.success ? statsData.data : {
        totalTopics: 0,
        totalPosts: 0,
        totalMembers: 0,
        onlineMembers: 0,
        categories: []
      }
    }
  } catch (error) {
    console.error('Error fetching forum data:', error)
    return {
      posts: [],
      categories: [],
      stats: {
        totalTopics: 0,
        totalPosts: 0,
        totalMembers: 0,
        onlineMembers: 0,
        categories: []
      }
    }
  }
}

export default async function Forum() {
  const { posts, categories, stats } = await getForumData()

  return (
    <ForumPage 
      initialPosts={posts}
      initialCategories={categories}
      initialStats={stats}
    />
  )
}