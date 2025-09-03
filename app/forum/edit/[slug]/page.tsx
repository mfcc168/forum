import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import EditForumContent from './EditForumContent';

// Server-side data fetching
async function getForumPost(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/forum/posts/${slug}`, {
      next: { 
        tags: [`forum-post-${slug}`]
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching forum post:', error)
    return null
  }
}

export default async function EditForumPage({ params }: { params: Promise<{ slug: string }> }) {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }

  // Await params (Next.js 15 requirement)
  const { slug } = await params

  // Fetch the post data server-side
  const post = await getForumPost(slug)

  if (!post) {
    redirect('/forum')
  }

  // Check forum edit permissions using centralized system
  if (!PermissionChecker.canEdit(user, 'forum', post)) {
    redirect('/forum');
  }

  return <EditForumContent initialPost={post} slug={slug} currentUser={user} />;
}