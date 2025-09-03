'use client'

import { PageHeader } from '@/app/components/ui/PageHeader'
import { WelcomeSection } from '@/app/components/ui/WelcomeSection'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { ForumContent } from '@/app/components/pages/forum/ForumContent'
import { formatNumber } from '@/lib/utils'
import type { ForumPost, ForumCategory, ForumStatsResponse } from '@/lib/types'

interface ForumPageProps {
  initialPosts: ForumPost[]
  initialCategories: ForumCategory[]
  initialStats: ForumStatsResponse
}

export default function ForumPage({ 
  initialPosts, 
  initialCategories, 
  initialStats 
}: ForumPageProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <PageHeader 
          title={t.forum.pageTitle}
          description={t.forum.pageDescription}
        />

        {/* Welcome Panel */}
        <WelcomeSection
          title={t.forum.welcome.title}
          description={t.forum.welcome.description}
          icon="users"
        >
          {/* Stats */}
          {initialStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{initialStats.totalPosts || initialStats.totalTopics || 0}</div>
                <div className="text-sm text-slate-600">{t.forum?.stats?.totalPosts || 'Total Posts'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{formatNumber(initialStats.totalViews || 0)}</div>
                <div className="text-sm text-slate-600">{t.forum?.stats?.totalViews || 'Total Views'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{initialStats.onlineMembers || 0}</div>
                <div className="text-sm text-slate-600">{t.stats?.onlineMembers || 'Online Members'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{initialStats.totalMembers || 0}</div>
                <div className="text-sm text-slate-600">{t.stats?.totalMembers || 'Total Members'}</div>
              </div>
            </div>
          )}
        </WelcomeSection>

        {/* Forum Content (Client Component with initial data) */}
        <ForumContent 
          initialPosts={initialPosts}
          initialCategories={initialCategories}
          initialStats={initialStats}
        />
      </div>
    </div>
  )
}