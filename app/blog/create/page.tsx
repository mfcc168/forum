import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import CreateBlogContent from './CreateBlogContent';

export default async function CreateBlogPage() {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Check blog creation permissions using centralized system
  if (!PermissionChecker.canCreate(user, 'blog')) {
    redirect('/blog');
  }

  return <CreateBlogContent />;
}