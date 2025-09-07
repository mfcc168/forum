'use client'

import { BlogContent } from '@/app/components/pages/blog/BlogContent'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { WelcomeSection } from '@/app/components/ui/WelcomeSection'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { formatNumber } from '@/lib/utils'
import type { BlogPost, BlogStats, BlogCategory } from '@/lib/types'

interface BlogPageProps {
  initialPosts: BlogPost[]
  initialStats?: BlogStats
  initialCategories?: BlogCategory[]
}

export default function BlogPage({ 
  initialPosts, 
  initialStats, 
  initialCategories 
}: BlogPageProps) {
  const { t } = useTranslation()

  // Ensure initial data is always arrays
  const safeInitialPosts = Array.isArray(initialPosts) ? initialPosts : []
  const safeInitialCategories = Array.isArray(initialCategories) ? initialCategories : []

  // Use provided stats or calculate basic ones
  const stats: BlogStats = initialStats || {
    // Base StatsResponse properties
    totalPosts: safeInitialPosts.length,
    totalViews: safeInitialPosts.reduce((sum, post) => sum + (post.stats?.viewsCount || 0), 0),
    totalLikes: safeInitialPosts.reduce((sum, post) => sum + (post.stats?.likesCount || 0), 0),
    totalShares: safeInitialPosts.reduce((sum, post) => sum + (post.stats?.sharesCount || 0), 0),
    totalUsers: new Set(safeInitialPosts.map(post => post.author?.name).filter(Boolean)).size,
    activeUsers: new Set(safeInitialPosts.map(post => post.author?.name).filter(Boolean)).size,
    categoriesCount: new Set(safeInitialPosts.map(post => post.category)).size,
    
    // BlogStats-specific properties
    totalDrafts: 0,
    categories: safeInitialCategories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      postsCount: cat.stats?.postsCount || 0,
      order: cat.order
    })),
    recentPosts: safeInitialPosts.slice(0, 5).map(post => ({
      title: post.title,
      slug: post.slug,
      viewsCount: post.stats?.viewsCount || 0,
      publishedAt: post.publishedAt || post.createdAt
    })),
    popularPosts: safeInitialPosts.slice(0, 5).map(post => ({
      title: post.title,
      slug: post.slug,
      viewsCount: post.stats?.viewsCount || 0,
      likesCount: post.stats?.likesCount || 0
    }))
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <PageHeader 
          title={t.blog.pageTitle}
          description={t.blog.pageDescription}
        />

        {/* Welcome Panel */}
        <WelcomeSection
          title={t.blog.welcome?.title || t.blog.pageTitle}
          description={t.blog.welcome?.description || t.blog.pageDescription}
          icon="news"
        >
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.totalPosts || 0}</div>
                <div className="text-sm text-slate-600">{t.blog?.posts || 'Total Posts'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{formatNumber(stats.totalViews)}</div>
                <div className="text-sm text-slate-600">{t.blog?.totalViews || 'Total Views'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.activeUsers || 0}</div>
                <div className="text-sm text-slate-600">{t.stats?.onlineMembers || 'Online Members'}</div>
              </div>
              <div className="minecraft-card p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.totalUsers || 0}</div>
                <div className="text-sm text-slate-600">{t.stats?.totalMembers || 'Total Members'}</div>
              </div>
            </div>
          )}
        </WelcomeSection>

        {/* Blog Content (Client Component with initial data) */}
        <BlogContent 
          initialPosts={safeInitialPosts}
          initialCategories={safeInitialCategories}
          initialStats={stats}
        />
      </div>
    </div>
  )
}