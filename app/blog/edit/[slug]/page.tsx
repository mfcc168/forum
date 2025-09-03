import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import EditBlogContent from './EditBlogContent';

// Server-side data fetching
async function getBlogPost(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/blog/posts/${slug}`, {
      next: { 
        tags: [`blog-post-${slug}`]
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export default async function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check blog edit permissions using centralized system
  if (!PermissionChecker.canEdit(user, 'blog')) {
    redirect('/blog');
  }

  // Await params (Next.js 15 requirement)
  const { slug } = await params

  // Fetch the post data server-side
  const post = await getBlogPost(slug)

  if (!post) {
    redirect('/blog')
  }

  return <EditBlogContent initialPost={post} slug={slug} />
}