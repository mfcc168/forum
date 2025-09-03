import React from 'react';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import type { TranslationStructure } from '@/lib/types/translations';

interface FeatureGridClientProps {
  t: TranslationStructure
}

export function FeatureGrid({ t }: FeatureGridClientProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
      {/* Server Info Panel */}
      <Card variant="panel">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white text-2xl">🗺️</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.home.serverInfo.title}</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600">{t.home.serverInfo.ip}</span>
            <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">play.ourserver.com</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t.home.serverInfo.version}</span>
            <span className="font-semibold">1.21.x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t.home.serverInfo.gameMode}</span>
            <Badge variant="default">{t.home.serverInfo.survival}</Badge>
          </div>
        </div>
      </Card>

      {/* Features Panel */}
      <Card variant="panel">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white text-2xl">⚡</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.home.features.title}</h3>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span>{t.home.features.economy}</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>{t.home.features.shops}</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>{t.home.features.claims}</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span>{t.home.features.events}</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
            <span>{t.home.features.community}</span>
          </li>
        </ul>
      </Card>

      {/* Quick Actions Panel */}
      <Card variant="panel">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white text-2xl">🚀</span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{t.home.quickActions.title}</h3>
        <div className="space-y-3">
          <Button variant="primary" size="md" className="w-full py-3">
            📥 {t.home.quickActions.downloadPack}
          </Button>
          <Button variant="primary" size="md" className="w-full py-3">
            📖 {t.home.quickActions.wiki}
          </Button>
          <Button variant="primary" size="md" className="w-full py-3">
            💬 {t.home.quickActions.discord}
          </Button>
        </div>
      </Card>
    </div>
  );
}