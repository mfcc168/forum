'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { HeroSection } from '@/app/components/pages/home/HeroSection';
import { PageContainer } from '@/app/components/ui/PageContainer';
import { LoadingScreen } from '@/app/components/layout';

export default function Home() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No data fetching needed for this page currently
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingScreen message={t.common.loadingServerData} />;
  }

  return (
    <PageContainer>
      <HeroSection />
    </PageContainer>
  );
}
