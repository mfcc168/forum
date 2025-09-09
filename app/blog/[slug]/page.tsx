import { Card } from '@/app/components/ui/Card'
import Link from 'next/link'
import { BlogDetailContent } from '@/app/components/pages/blog/BlogDetailContent'

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>
}

// Server-side data fetching function
async function getBlogPostData(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    // Fetch specific blog post by slug using dedicated API endpoint
    const postRes = await fetch(`${baseUrl}/api/blog/posts/${slug}`, { 
      next: { 
        revalidate: 10, // Revalidate every 10 seconds for faster updates
        tags: [`blog-post-${slug}`] // Add cache tag for targeted revalidation
      }
    })

    if (!postRes.ok) {
      if (postRes.status === 404) {
        return {
          post: null,
          error: 'Blog post not found'
        }
      }
      throw new Error('Failed to fetch blog post')
    }

    const result = await postRes.json()
    const post = result.success ? result.data.blogPost : null


    return {
      post: post || null,
      error: !post ? 'Blog post not found' : null
    }
  } catch (error) {
    console.error('Error fetching blog post data:', error)
    return {
      post: null,
      error: 'Failed to load blog post'
    }
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const { post, error } = await getBlogPostData(slug)

  // Handle error states server-side (like forum does)
  if (error || !post) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error || 'Blog post not found'}
            </h1>
            <p className="text-slate-600 mb-4">
              The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/blog" className="text-emerald-600 hover:text-emerald-700">
              ← Back to Blog
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <BlogDetailContent 
      slug={slug}
      initialPost={post}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const { post } = await getBlogPostData(slug)
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  return {
    title: `${post.title} | Blog`,
    description: post.description || post.excerpt || 'Blog post',
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

