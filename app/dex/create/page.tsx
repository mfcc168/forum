import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/utils/permissions';
import { getDexModelsServerSide } from '@/lib/utils/dex-models';
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

  // Fetch models server-side for SSR consistency
  const models = await getDexModelsServerSide();

  return <CreateDexContent initialModels={models} />;
}