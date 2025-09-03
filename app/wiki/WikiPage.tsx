'use client'

import { WikiContent } from '@/app/components/pages/wiki/WikiContent'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { WelcomeSection } from '@/app/components/ui/WelcomeSection'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { formatNumber } from '@/lib/utils'
import type { WikiGuide, WikiStats, WikiCategory } from '@/lib/types'

interface WikiPageProps {
  initialGuides: WikiGuide[]
  initialCategories?: WikiCategory[]
  initialStats: WikiStats
}

export default function WikiPage({ 
  initialGuides,
  initialCategories = [],
  initialStats
}: WikiPageProps) {
  const { t } = useTranslation()

  // Ensure initial data is always arrays
  const safeInitialGuides = Array.isArray(initialGuides) ? initialGuides : []

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <PageHeader 
          title={t.wiki?.pageTitle || 'Wiki'}
          description={t.wiki?.pageDescription || 'Comprehensive guides and documentation'}
        />

        {/* Welcome Panel */}
        <WelcomeSection
          title={t.wiki?.welcome?.title || t.wiki?.pageTitle || 'Wiki'}
          description={t.wiki?.welcome?.description || t.wiki?.pageDescription || 'Find guides and documentation'}
          icon="document"
        >
          {/* Stats */}
          {initialStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{initialStats.totalGuides || 0}</div>
                <div className="text-sm text-slate-600">{t.wiki?.stats?.guides || 'Total Guides'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{formatNumber(initialStats.totalViews)}</div>
                <div className="text-sm text-slate-600">{t.wiki?.stats?.totalViews || 'Total Views'}</div>
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

        {/* Wiki Content (Client Component with initial data) */}
        <WikiContent 
          initialGuides={safeInitialGuides}
          initialCategories={initialCategories}
          initialStats={initialStats}
        />
      </div>
    </div>
  )
}