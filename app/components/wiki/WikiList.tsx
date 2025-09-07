'use client'

import { memo, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { 
  ContentCard, 
  EmptyState, 
  Skeleton as CardSkeleton,
  type ContentCardProps 
} from '@/app/components/shared'
import { VirtualizedList } from '@/app/components/ui/VirtualizedList'
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
  /** Enable virtualization for large lists (>50 items) */
  enableVirtualization?: boolean
  /** Container height for virtualization */
  containerHeight?: number
  /** Callback for infinite scroll */
  onLoadMore?: () => void
  /** Whether more items are loading */
  isLoadingMore?: boolean
}

export const WikiList = memo(function WikiList({ 
  posts = [],
  compact = false, 
  showCategory = true, 
  showExcerpt = true,
  emptyMessage,
  isLoading = false,
  variant = 'default',
  enableVirtualization = true,
  containerHeight = 600,
  onLoadMore,
  isLoadingMore = false
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

  // Memoized render function for virtualization
  const renderGuideCard = useCallback((guide: WikiGuide, index: number) => (
    <ContentCard
      key={guide.id}
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
        tags: guide.tags
      }}
      variant={compact ? 'compact' : variant}
      show={{
        category: showCategory,
        excerpt: showExcerpt
      }}
      linkTo={`/wiki/${guide.slug}`}
    />
  ), [showExcerpt, translateCategoryName, compact, variant, showCategory])

  // Memoized key extractor
  const getItemKey = useCallback((guide: WikiGuide, index: number) => guide.id || guide.slug || index, [])

  // Loading skeleton for virtualized list
  const loadingComponent = useMemo(() => (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <CardSkeleton 
          key={index} 
          className={compact ? "h-32" : "h-48"} 
        />
      ))}
    </div>
  ), [compact])

  // Use virtualization for large lists
  if (enableVirtualization && posts.length > 50) {
    return (
      <VirtualizedList
        items={posts}
        renderItem={renderGuideCard}
        itemHeight={compact ? 128 : 192} // Approximate height based on variant
        containerHeight={containerHeight}
        getItemKey={getItemKey}
        gap={compact ? 16 : 24} // Tailwind space-y-4 = 16px, space-y-6 = 24px
        onLoadMore={onLoadMore}
        isLoading={isLoadingMore}
        loadingComponent={loadingComponent}
        className="rounded-lg"
      />
    )
  }

  // Standard rendering for smaller lists
  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {posts.map((guide) => renderGuideCard(guide, posts.indexOf(guide)))}
    </div>
  )
})

WikiList.displayName = 'WikiList'