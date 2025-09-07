import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/utils/permissions'
import CreateForumContent from '@/app/forum/create/CreateForumContent'

export default async function CreateForumPage() {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check forum creation permissions using centralized system
  if (!PermissionChecker.canCreate(user, 'forum')) {
    redirect('/forum')
  }

  return <CreateForumContent />
}