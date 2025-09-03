import React from 'react';
import { Card } from '@/app/components/ui/Card';
import type { TranslationStructure } from '@/lib/types/translations';

interface Stat {
  id: string
  label: string
  value: string | number
  icon: string
  change?: number
  max?: string | number
}

interface ServerStatsClientProps {
  stats: Stat[]
  t: TranslationStructure
}

export function ServerStats({ stats, t }: ServerStatsClientProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
      {stats.map((stat, index) => (
        <Card key={index} variant="default" className="text-center">
          <div className="text-2xl font-bold text-slate-800 mb-1">
            {stat.value}
            {stat.max && <span className="text-slate-500">/{stat.max}</span>}
          </div>
          <div className="text-sm text-slate-600">
            {t.home.stats[stat.label as keyof typeof t.home.stats]}
          </div>
        </Card>
      ))}
    </div>
  );
}