import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import EditDexContent from './EditDexContent';

// Server-side data fetching
async function getDexMonster(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/dex/monsters/${slug}`, {
      next: { 
        tags: [`dex-monster-${slug}`]
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    const monster = data.success ? data.data?.monster : null
    return monster
  } catch (error) {
    console.error('Error fetching dex monster:', error)
    return null
  }
}

export default async function EditDexPage({ params }: { params: Promise<{ slug: string }> }) {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check dex edit permissions using centralized system
  if (!PermissionChecker.canEdit(user, 'dex')) {
    redirect('/dex');
  }

  // Await params (Next.js 15 requirement)
  const { slug } = await params

  // Fetch the monster data server-side
  const monster = await getDexMonster(slug)

  if (!monster) {
    redirect('/dex')
  }

  return <EditDexContent initialMonster={monster} slug={slug} />
}