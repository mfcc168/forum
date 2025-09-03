import { Card } from '@/app/components/ui/Card'
import Link from 'next/link'
import { ForumDetailContent } from '@/app/components/pages/forum'

interface PostDetailPageProps {
  params: Promise<{ slug: string }>
}

// Server-side data fetching function
async function getPostData(postSlug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Fetch post and replies in parallel using slug-based routes
    const [postRes, repliesRes] = await Promise.all([
      fetch(`${baseUrl}/api/forum/posts/${postSlug}`, { 
        next: { 
          revalidate: 10, // Revalidate every 10 seconds for faster updates
          tags: [`forum-post-${postSlug}`] // Add cache tag for targeted revalidation
        }
      }),
      fetch(`${baseUrl}/api/forum/posts/${postSlug}/replies`, { 
        next: { 
          revalidate: 10, // Revalidate every 10 seconds for faster updates  
          tags: [`forum-replies-${postSlug}`] // Add cache tag for targeted revalidation
        }
      })
    ])

    const [postData, repliesData] = await Promise.all([
      postRes.ok ? postRes.json() : { success: false, data: null },
      repliesRes.ok ? repliesRes.json() : { success: false, data: [] }
    ])

    // Handle replies data - could be new format {success, data} or old format (direct array)
    let replies = []
    if (repliesData.success !== undefined) {
      // New format with success wrapper
      replies = repliesData.success ? repliesData.data : []
    } else if (Array.isArray(repliesData)) {
      // Old format - direct array
      replies = repliesData
    }


    return {
      post: postData.success ? postData.data?.post : null,
      replies,
      error: !postData.success ? 'Post not found' : null
    }
  } catch (error) {
    console.error('Error fetching post data:', error)
    return {
      post: null,
      replies: [],
      error: 'Failed to load post'
    }
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params
  const { post, replies, error } = await getPostData(slug)

  // Handle error states server-side
  if (error || !post) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error || 'Post not found'}
            </h1>
            <p className="text-slate-600 mb-4">
              The post you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/forum" className="text-emerald-600 hover:text-emerald-700">
              ← Back to Forum
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ForumDetailContent 
      slug={post.slug}
      initialPost={post}
      initialReplies={replies}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PostDetailPageProps) {
  const { slug } = await params
  const { post } = await getPostData(slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    }
  }

  return {
    title: `${post.title} | Forum`,
    description: post.excerpt || post.content?.substring(0, 160) || 'Forum discussion',
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content?.substring(0, 160),
      type: 'article',
    }
  }
}