import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import CreateDexContent from '@/app/dex/create/CreateDexContent';

export default async function CreateDexPage() {
  // Server-side authentication check
  const user = await getServerUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Check dex creation permissions using centralized system (admin-only like wiki/blog)
  if (!PermissionChecker.canCreate(user, 'dex')) {
    redirect('/dex');
  }

  return <CreateDexContent />;
}