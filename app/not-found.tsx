'use client';

import Link from 'next/link';
import { Icon } from '@/app/components/ui/Icon';
import { useTranslation } from '@/lib/contexts/LanguageContext';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="minecraft-panel p-8 max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Icon name="warning" className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">{t.notFound.title}</h1>
          <p className="text-slate-600 mb-6">
            {t.notFound.description}
          </p>
          <Link
            href="/"
            className="minecraft-button px-6 py-3 inline-flex items-center space-x-2"
          >
            <Icon name="home" className="w-4 h-4" />
            <span>{t.notFound.goHome}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}