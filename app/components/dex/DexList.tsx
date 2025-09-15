'use client'

import { memo } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { 
  ContentCard, 
  EmptyState, 
  Skeleton as CardSkeleton
} from '@/app/components/shared'
import { getDexCategoryColor } from '@/lib/config/dex-categories'
import type { DexMonster } from '@/lib/types'

interface DexListProps {
  monsters?: DexMonster[]
  compact?: boolean
  showCategory?: boolean
  showExcerpt?: boolean
  emptyMessage?: string
  isLoading?: boolean
}

export const DexList = memo(function DexList({ 
  monsters = [],
  compact = false, 
  showCategory = true, 
  showExcerpt = true,
  emptyMessage,
  isLoading = false
}: DexListProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  
  // Use centralized permission system
  const permissions = usePermissions(session, 'dex')

  // Get category name translation (similar to other modules)
  const translateCategoryName = (categoryName: string) => {
    const categoryNames = t.dex?.categoryNames || {}
    return categoryNames[categoryName as keyof typeof categoryNames] || 
           categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: compact ? 4 : 3 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    )
  }

  // Empty state
  if (!monsters || monsters.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || t.dex.emptyState.title}
        description={t.dex.emptyState.description}
        action={permissions.canCreate ? {
          label: t.dex.emptyState.createFirst,
          onClick: () => window.location.href = "/dex/create"
        } : undefined}
        icon="cube"
      />
    )
  }

  return (
    <div className={`space-y-${compact ? '4' : '6'}`}>
      {monsters.map((monster) => (
        <ContentCard
          key={monster.id}
          item={{
            id: monster.id,
            title: monster.name,
            excerpt: showExcerpt ? monster.excerpt : undefined,
            content: monster.description,
            author: monster.author,
            createdAt: monster.createdAt,
            updatedAt: monster.updatedAt,
            slug: monster.slug,
            category: showCategory && monster.category ? {
              name: translateCategoryName(monster.category),
              slug: monster.category,
              color: getDexCategoryColor(monster.category).bg
            } : undefined,
            tags: monster.tags,
            stats: {
              views: monster.stats?.viewsCount || 0,
              likes: monster.stats?.likesCount || 0,
              bookmarks: monster.stats?.bookmarksCount || 0,
              shares: monster.stats?.sharesCount || 0
            },
            status: monster.status
          }}
          linkTo={`/dex/${monster.slug}`}
          variant={compact ? 'compact' : 'default'}
          show={{
            category: showCategory,
            excerpt: showExcerpt,
            stats: true,
            author: true,
            date: true
          }}
        />
      ))}
    </div>
  )
})