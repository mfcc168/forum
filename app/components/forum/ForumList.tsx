'use client'

import { memo } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { 
  ContentCard, 
  EmptyState, 
  Skeleton as CardSkeleton,
  type ContentCardProps
} from '@/app/components/shared'
import { generateExcerpt } from '@/app/components/shared/ContentRenderer'
import type { ForumPost } from '@/lib/types'

interface ForumListProps {
  posts?: ForumPost[]
  compact?: boolean
  showCategory?: boolean
  showExcerpt?: boolean
  emptyMessage?: string
  isLoading?: boolean
  variant?: ContentCardProps['variant']
}

export const ForumList = memo(function ForumList({ 
  posts = [],
  compact = false,
  showCategory = true,
  showExcerpt = true,
  emptyMessage,
  isLoading = false,
  variant = 'default'
}: ForumListProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  
  const isAuthenticated = !!session

  // Get category name translation
  const translateCategoryName = (categoryName: string) => {
    return t.forum.categoryNames[categoryName as keyof typeof t.forum.categoryNames] || categoryName
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: compact ? 5 : 4 }).map((_, index) => (
          <CardSkeleton 
            key={index} 
            height={120}
            variant="rectangular"
            className="h-auto"
          />
        ))}
      </div>
    )
  }

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || t.forum.emptyState?.noPosts || 'No posts yet'}
        description={t.forum.emptyState?.checkBack || 'Check back later for new discussions'}
        icon="messageCircle"
        variant="card"
        action={isAuthenticated ? {
          label: t.forum.actions?.createFirst || 'Start a Discussion',
          onClick: () => { window.location.href = '/forum/create' }
        } : undefined}
      />
    )
  }

  // Transform ForumPost to ContentCard format
  const transformPost = (post: ForumPost) => {
    return {
      id: post.id?.toString() || '',
      title: post.title,
      excerpt: showExcerpt ? generateExcerpt(post.content, 120) : undefined,
      author: {
        name: post.author?.name || 'Unknown Author',
        avatar: post.author?.avatar || undefined,
        id: post.author?.id || post.author?.toString()
      },
      category: showCategory ? {
        name: translateCategoryName(post.categoryName),
        slug: post.categoryName,
      } : undefined,
      tags: post.tags || [],
      stats: {
        views: post.stats?.viewsCount || post.stats.viewsCount || 0,
        likes: post.stats?.likesCount || 0,
        replies: post.stats?.repliesCount || post.stats.repliesCount || 0,
        bookmarks: post.stats?.bookmarksCount || 0,
        shares: post.stats?.sharesCount || 0
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isPinned: post.isPinned,
      isLocked: post.isLocked
    }
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-6'}`}>
      {posts.filter(Boolean).map((post, index) => {
        const transformedPost = transformPost(post)
        
        return (
          <ContentCard
            key={post.id?.toString() || `post-${index}`}
            item={transformedPost}
            variant={compact ? 'mini' : variant}
            theme="minecraft"
            linkTo={`/forum/${post.slug}`}
            clickable={true}
            show={{
              author: true,
              category: showCategory,
              tags: true,
              stats: true,
              excerpt: showExcerpt && !compact,
              date: true,
              status: false // Forum posts don't show status
            }}
            className={compact ? 'shadow-sm hover:shadow-md' : ''}
            headerContent={
              // Custom header for pinned/locked indicators
              (post.isPinned || post.isLocked) ? (
                <div className="flex items-center space-x-2 mb-2">
                  {post.isPinned && (
                    <span className="text-xs text-amber-600 font-medium">
                      📌 {t.forum.postCard.pinned}
                    </span>
                  )}
                  {post.isLocked && (
                    <span className="text-xs text-red-600 font-medium">
                      🔒 {t.forum.postCard.locked}
                    </span>
                  )}
                </div>
              ) : undefined
            }
          />
        )
      })}
    </div>
  )
})

