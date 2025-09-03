import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import CreateWikiContent from './CreateWikiContent';

export default async function CreateWikiPage() {
  // Server-side authentication check
  const user = await getServerUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Check wiki creation permissions using centralized system
  if (!PermissionChecker.canCreate(user, 'wiki')) {
    redirect('/wiki');
  }

  return <CreateWikiContent />;
}