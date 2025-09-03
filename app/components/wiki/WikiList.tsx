'use client'

import { memo } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { 
  ContentCard, 
  EmptyState, 
  Skeleton as CardSkeleton,
  type ContentCardProps 
} from '@/app/components/shared'
import { getWikiCategoryColor } from '@/lib/config/wiki-categories'
import type { WikiGuide } from '@/lib/types'

interface WikiListProps {
  posts?: WikiGuide[] // Renamed from 'guides' to 'posts' for consistency
  compact?: boolean
  showCategory?: boolean
  showExcerpt?: boolean
  emptyMessage?: string
  isLoading?: boolean
  variant?: ContentCardProps['variant']
}

export const WikiList = memo(function WikiList({ 
  posts = [],
  compact = false, 
  showCategory = true, 
  showExcerpt = true,
  emptyMessage,
  isLoading = false,
  variant = 'default'
}: WikiListProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  
  // Use centralized permission system (consistent with BlogList/ForumList)
  const permissions = usePermissions(session, 'wiki')

  // Get category name translation (consistent with BlogList/ForumList)
  const translateCategoryName = (categoryName: string) => {
    return t.wiki.categories[categoryName as keyof typeof t.wiki.categories] || categoryName
  }

  // Loading state (consistent pattern)
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: compact ? 4 : 3 }).map((_, index) => (
          <CardSkeleton 
            key={index} 
            className={compact ? "h-32" : "h-48"} 
          />
        ))}
      </div>
    )
  }

  // Empty state (consistent pattern)
  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || t.wiki?.emptyState?.title || 'No guides found'}
        description={t.wiki?.emptyState?.description || 'There are no guides to display at this time.'}
        action={permissions.canCreate ? {
          label: t.wiki?.emptyState?.actionLabel || 'Create Guide',
          onClick: () => window.location.href = '/wiki/create'
        } : undefined}
      />
    )
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {posts.map((guide) => (
        <ContentCard
          key={guide.id}
          contentType="wiki"
          item={{
            ...guide,
            title: guide.title,
            excerpt: showExcerpt ? (guide.excerpt || '') : '',
            slug: guide.slug,
            category: {
              name: translateCategoryName(guide.category),
              slug: guide.category,
              color: getWikiCategoryColor(guide.category).text
            },
            author: guide.author,
            stats: {
              views: guide.stats.viewsCount,
              likes: guide.stats.likesCount,
              bookmarks: guide.stats.bookmarksCount,
              shares: guide.stats.sharesCount
            },
            createdAt: guide.createdAt,
            difficulty: guide.difficulty,
            tags: guide.tags
          }}
          variant={variant}
          compact={compact}
          showCategory={showCategory}
          showExcerpt={showExcerpt}
          href={`/wiki/${guide.slug}`}
        />
      ))}
    </div>
  )
})

WikiList.displayName = 'WikiList'