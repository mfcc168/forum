import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import EditWikiContent from '@/app/wiki/edit/[slug]/EditWikiContent';

// Server-side data fetching
async function getWikiGuide(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/wiki/guides/${slug}`, {
      next: { 
        tags: [`wiki-guide-${slug}`]
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching wiki guide:', error)
    return null
  }
}

export default async function EditWikiPage({ params }: { params: Promise<{ slug: string }> }) {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check wiki edit permissions using centralized system
  if (!PermissionChecker.canEdit(user, 'wiki')) {
    redirect('/wiki');
  }

  // Await params (Next.js 15 requirement)
  const { slug } = await params

  // Fetch the guide data server-side
  const guide = await getWikiGuide(slug)

  if (!guide) {
    redirect('/wiki')
  }

  return <EditWikiContent initialGuide={guide} slug={slug} />
}