'use client'

import { DexContent } from '@/app/components/pages/dex/DexContent'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { WelcomeSection } from '@/app/components/ui/WelcomeSection'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { formatNumber } from '@/lib/utils'
import type { DexMonster, DexStats, DexCategory } from '@/lib/types'

interface DexPageProps {
  initialMonsters: DexMonster[]
  initialCategories?: DexCategory[]
  initialStats: DexStats
}

export default function DexPage({ 
  initialMonsters,
  initialCategories = [],
  initialStats
}: DexPageProps) {
  const { t } = useTranslation()

  // Ensure initial data is always arrays
  const safeInitialMonsters = Array.isArray(initialMonsters) ? initialMonsters : []

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <PageHeader 
          title={t.dex?.pageTitle || 'Monster Dex'}
          description={t.dex?.pageDescription || 'Discover all creatures in our Minecraft server'}
        />

        {/* Welcome Panel */}
        <WelcomeSection
          title={t.dex?.welcome?.title || t.dex?.pageTitle || 'Monster Dex'}
          description={t.dex?.welcome?.description || t.dex?.pageDescription || 'Explore monsters and creatures'}
          icon="gamepad"
        >
          {/* Stats */}
          {initialStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{initialStats.totalMonsters || 0}</div>
                <div className="text-sm text-slate-600">{t.dex?.stats?.monsters || 'Total Monsters'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{formatNumber(initialStats.totalViews)}</div>
                <div className="text-sm text-slate-600">{t.dex?.stats?.totalViews || 'Total Views'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{initialStats.activeUsers || 0}</div>
                <div className="text-sm text-slate-600">{t.stats?.onlineMembers || 'Online Members'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{initialStats.totalUsers || 0}</div>
                <div className="text-sm text-slate-600">{t.stats?.totalMembers || 'Total Members'}</div>
              </div>
            </div>
          )}
        </WelcomeSection>

        {/* Dex Content (Client Component with initial data) */}
        <DexContent 
          initialMonsters={safeInitialMonsters}
          initialCategories={initialCategories}
          initialStats={initialStats}
        />
      </div>
    </div>
  )
}