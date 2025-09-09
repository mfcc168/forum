import React from 'react';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Icon } from '@/app/components/ui/Icon';
import type { TranslationStructure } from '@/lib/types';

interface Update {
  id: string
  title: string
  excerpt: string
  date: string
  type: 'news' | 'update' | 'announcement'
}

interface RecentUpdatesClientProps {
  updates: Update[]
  t: TranslationStructure
}

export function RecentUpdates({ updates, t }: RecentUpdatesClientProps) {

  return (
    <Card variant="panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-800">📰 {t.home.recentUpdates.title}</h2>
        <button className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1">
          <span>{t.home.recentUpdates.viewAll}</span>
          <Icon name="arrow" size="sm" />
        </button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {updates.map((update, index) => (
          <Card key={index} variant="default">
            <Badge variant="default" className="mb-3">{update.type}</Badge>
            <h4 className="font-bold text-slate-800 mb-2">{update.title}</h4>
            <p className="text-slate-600 text-sm mb-3">
              {update.excerpt}
            </p>
            <div className="text-xs text-slate-500">{update.date}</div>
          </Card>
        ))}
      </div>
    </Card>
  );
}