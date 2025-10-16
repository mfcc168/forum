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
import { getBlogCategoryColor } from '@/lib/config/blog-categories'
import type { BlogPost } from '@/lib/types'

interface BlogListProps {
  posts?: BlogPost[]
  compact?: boolean
  showCategory?: boolean
  showExcerpt?: boolean
  emptyMessage?: string
  isLoading?: boolean
  variant?: ContentCardProps['variant']
}

export const BlogList = memo(function BlogList({ 
  posts = [],
  compact = false, 
  showCategory = true, 
  showExcerpt = true,
  emptyMessage,
  isLoading = false,
  variant = 'default'
}: BlogListProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  
  // Use centralized permission system
  const permissions = usePermissions(session, 'blog')

  // Get category name translation (similar to forum)
  const translateCategoryName = (categoryName: string) => {
    return t.blog.categoryNames[categoryName as keyof typeof t.blog.categoryNames] || categoryName
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: compact ? 4 : 3 }).map((_, index) => (
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
        title={emptyMessage || t.blog.emptyState.noPosts}
        description={t.blog.emptyState.checkBack}
        icon="document"
        variant="card"
        action={permissions.canCreate ? {
          label: t.blog.actions.createFirst,
          onClick: () => { window.location.href = '/blog/create' }
        } : undefined}
      />
    )
  }

  // Transform BlogPost to ContentCard format
  const transformPost = (post: BlogPost) => {
    // Get category color for styling
    const categoryColor = getBlogCategoryColor(post.category)
    
    return {
      id: post.slug,
      slug: post.slug,
      title: post.title,
      excerpt: showExcerpt ? post.excerpt : undefined,
      author: {
        name: post.author?.name || 'Unknown Author',
        avatar: post.author?.avatar || undefined,
        id: post.author?.id || post.author?.toString()
      },
      category: showCategory ? {
        name: translateCategoryName(post.category),
        slug: post.category,
        color: categoryColor.bg // Use just the background color string
      } : undefined,
      tags: post.tags,
      stats: {
        views: post.stats.viewsCount || post.stats?.viewsCount || 0
        // Blog posts don't have likes/bookmarks/shares - only views
      },
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      status: post.status
    }
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-6'}`}>
      {posts.filter(Boolean).map((post) => {
        const transformedPost = transformPost(post)
        
        return (
          <ContentCard
            key={post.slug}
            item={transformedPost}
            variant={compact ? 'mini' : variant}
            theme="default"
            linkTo={`/blog/${post.slug}`}
            clickable={true}
            show={{
              author: true,
              category: showCategory,
              tags: true,
              stats: true,
              excerpt: showExcerpt && !compact,
              date: true,
              status: permissions.isAdmin // Only show status to admins
            }}
            statsShow={{
              views: true,
              likes: false, // Blog posts don't have likes
              replies: false, // Blog posts don't have replies
              bookmarks: false, // Blog posts don't have bookmarks
              shares: false // Blog posts don't have shares
            }}
            className={compact ? 'shadow-sm hover:shadow-md' : ''}
          />
        )
      })}
    </div>
  )
})