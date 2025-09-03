import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import CreateForumContent from './CreateForumContent'

export default async function CreateForumPage() {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // All logged-in users can create forum posts
  // No role restriction needed

  return <CreateForumContent />
}