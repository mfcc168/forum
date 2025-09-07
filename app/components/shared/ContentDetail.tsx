'use client'

import { useCallback, memo } from 'react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { Icon } from '@/app/components/ui/Icon'
import { ContentActions, type ContentActionsConfig } from './ContentActions'
import { AuthorDisplay } from './AuthorDisplay'
import { TagList } from './TagList'
import { CategoryBadge } from './CategoryBadge'
import { ContentRenderer } from './ContentRenderer'
import { formatSimpleDate, formatNumber } from '@/lib/utils'

export interface ContentDetailConfig {
  /** Type of content */
  contentType: 'blog' | 'forum'
  
  /** Display options */
  showActions?: boolean
  showMeta?: boolean
  showStats?: boolean
  showCategory?: boolean
  showTags?: boolean
  showAuthor?: boolean
  
  /** Theme configuration */
  theme?: 'default' | 'minecraft' | 'minimal'
  
  /** Category configuration */
  categoryConfig?: {
    getColor?: (category: string) => { bg: string; text: string }
    translateName?: (name: string) => string
  }
  
  /** Actions configuration */
  actionsConfig?: ContentActionsConfig
}

interface ContentDetailProps {
  content: {
    slug?: string
    title: string
    content: string
    excerpt?: string
    category?: string
    categoryName?: string
    tags?: string[]
    author?: {
      name: string
      avatar?: string
      id?: string
    }
    authorName?: string
    authorAvatar?: string
    stats?: {
      viewsCount?: number
      likesCount?: number
      bookmarksCount?: number
      sharesCount?: number
      repliesCount?: number
    }
    createdAt?: Date
    publishedAt?: Date
    updatedAt?: Date
    status?: string
    isPinned?: boolean
    isLocked?: boolean
  }
  config: ContentDetailConfig
  onActionSuccess?: (action: string) => void
}

export const ContentDetail = memo(function ContentDetail({
  content,
  config,
  onActionSuccess
}: ContentDetailProps) {
  const { t } = useTranslation()

  // Get the display date based on content type
  const getDisplayDate = () => {
    if (config.contentType === 'blog') {
      return content.publishedAt || content.createdAt
    }
    return content.createdAt
  }

  // Get category name with translation
  const getCategoryName = useCallback((category?: string) => {
    if (!category) return 'General'
    
    if (config.categoryConfig?.translateName) {
      return config.categoryConfig.translateName(category)
    }
    
    // Default translation logic
    const categoryKey = config.contentType === 'blog' ? 'blog' : 'forum'
    const categoryNames = t[categoryKey]?.categoryNames || {}
    return categoryNames[category as keyof typeof categoryNames] || 
           (category.charAt(0).toUpperCase() + category.slice(1))
  }, [config.categoryConfig, config.contentType, t])

  // Get author information
  const getAuthor = () => {
    if (content.author) {
      return content.author
    }
    if (content.authorName) {
      return {
        name: content.authorName,
        avatar: content.authorAvatar,
        id: undefined
      }
    }
    return null
  }


  // Get theme classes
  const getThemeClasses = () => {
    switch (config.theme) {
      case 'minecraft':
        return {
          container: 'bg-amber-50 border-amber-200 shadow-amber-100',
          header: 'border-amber-200',
          accent: 'text-amber-800'
        }
      case 'minimal':
        return {
          container: 'bg-white border-slate-100 shadow-sm',
          header: 'border-slate-100',
          accent: 'text-slate-600'
        }
      default:
        return {
          container: 'bg-white border-slate-200 shadow-xl',
          header: 'border-slate-200',
          accent: 'text-slate-700'
        }
    }
  }

  const themeClasses = getThemeClasses()
  const author = getAuthor()
  const displayDate = getDisplayDate()
  const categoryName = content.categoryName || content.category

  return (
    <article className={`rounded-2xl border overflow-hidden ${themeClasses.container}`}>
      {/* Header */}
      <div className="p-8 pb-6">
        {/* Status Indicators for Forum Posts */}
        {config.contentType === 'forum' && (content.isPinned || content.isLocked) && (
          <div className="flex items-center space-x-2 mb-4">
            {content.isPinned && (
              <span className="text-xs text-amber-600 font-medium flex items-center">
                📌 {t.forum?.postCard?.pinned || 'Pinned'}
              </span>
            )}
            {content.isLocked && (
              <span className="text-xs text-red-600 font-medium flex items-center">
                🔒 {t.forum?.postCard?.locked || 'Locked'}
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        {config.showCategory && categoryName && (
          <div className="mb-4">
            <CategoryBadge
              category={{
                name: getCategoryName(categoryName),
                slug: categoryName,
                color: config.categoryConfig?.getColor?.(categoryName)?.bg
              }}
              variant={config.theme === 'minecraft' ? 'minecraft' : 'default'}
              size="md"
            />
          </div>
        )}

        {/* Title */}
        <h1 className={`text-4xl font-bold leading-tight mb-6 ${themeClasses.accent}`}>
          {content.title}
        </h1>

        {/* Author and Meta */}
        {config.showMeta && (
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-6">
            {config.showAuthor && author && (
              <AuthorDisplay
                name={author.name}
                avatar={author.avatar}
                authorId={author.id}
                size="sm"
                variant="horizontal"
              />
            )}
            
            {displayDate && (
              <div className="flex items-center space-x-2">
                <Icon name="calendar" className="w-4 h-4" />
                <time dateTime={displayDate.toISOString()}>
                  {formatSimpleDate(displayDate)}
                </time>
              </div>
            )}

            {config.showStats && content.stats && (
              <div className="flex items-center space-x-4">
                {content.stats.viewsCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Icon name="eye" className="w-4 h-4" />
                    <span>{formatNumber(content.stats.viewsCount)}</span>
                  </div>
                )}
                
                {config.contentType === 'forum' && content.stats.repliesCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Icon name="message" className="w-4 h-4" />
                    <span>{formatNumber(content.stats.repliesCount)} replies</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {config.showTags && content.tags && content.tags.length > 0 && (
          <div className="mb-6">
            <TagList
              tags={content.tags}
              variant="default"
              maxVisible={10}
              size="md"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`border-t ${themeClasses.header}`}>
        <div className="p-8">
          <ContentRenderer
            content={content.content}
            contentType="html"
            className="prose prose-slate max-w-none"
            enableSyntaxHighlighting={true}
            processLinks={true}
            openLinksInNewTab={true}
          />
        </div>
      </div>

      {/* Actions */}
      {config.showActions && config.actionsConfig && (
        <div className={`border-t ${themeClasses.header} p-6`}>
          <ContentActions
            config={config.actionsConfig}
            onEdit={() => onActionSuccess?.('edit')}
            onDelete={() => onActionSuccess?.('delete')}
            onStatsChange={() => onActionSuccess?.('stats')}
          />
        </div>
      )}
    </article>
  )
})