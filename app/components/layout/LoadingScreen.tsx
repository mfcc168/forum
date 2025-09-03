'use client';

import { PageContainer } from '@/app/components/ui/PageContainer';
import { pageStyles } from '@/app/components/styles';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <PageContainer>
      <div className={pageStyles.loadingScreen}>
        <div className="text-center">
          <div className={pageStyles.loadingSpinner}></div>
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
    </PageContainer>
  );
}