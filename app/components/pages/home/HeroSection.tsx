import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { Icon } from '@/app/components/ui/Icon';
import { useTranslation } from '@/lib/contexts/LanguageContext';

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <div className="text-center mb-16">
      <div className="mb-8">
        <div className="minecraft-badge mb-4 inline-flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>{t.home.serverStatus}</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          <span className="minecraft-gradient-text">{t.home.title}</span>
          <br />
          <span className="text-slate-800">{t.home.subtitle}</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t.home.description}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button variant="primary" size="lg" className="px-8 py-4 text-lg">
          <Icon name="gamepad" className="mr-2" /> {t.home.joinServer}
        </Button>
        <Button variant="secondary" size="lg" className="px-8 py-4 text-lg">
          <Icon name="document" className="mr-2" /> {t.home.viewRules}
        </Button>
      </div>
    </div>
  );
}