'use client'

import { memo, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthorDisplay } from './AuthorDisplay'
import { TagList } from './TagList'
import CategoryBadge from './CategoryBadge'
import StatsDisplay from './StatsDisplay'
import { Icon } from '@/app/components/ui/Icon'
import { formatSimpleDate } from '@/lib/utils'

export interface ContentCardProps {
  /** Card content item */
  item: {
    /** Unique identifier */
    id?: string
    slug?: string
    /** Title of the content */
    title: string
    /** Optional excerpt or description */
    excerpt?: string
    /** Optional content preview */
    content?: string
    /** Author information */
    author: {
      name: string
      avatar?: string
      id?: string
    }
    /** Category information */
    category?: {
      name: string
      slug?: string
      color?: string
    }
    /** Tags array */
    tags?: string[]
    /** Statistics */
    stats?: {
      views?: number
      likes?: number
      replies?: number
      bookmarks?: number
      shares?: number
    }
    /** Timestamps */
    createdAt?: Date | string
    updatedAt?: Date | string
    publishedAt?: Date | string
    /** Status indicators */
    isPinned?: boolean
    isLocked?: boolean
    isFeatured?: boolean
    status?: 'published' | 'draft' | 'archived'
  }
  
  /** Card layout variant */
  variant?: 'default' | 'compact' | 'featured' | 'minimal' | 'grid' | 'mini'
  
  /** Card styling theme */
  theme?: 'default' | 'minecraft' | 'glass' | 'bordered'
  
  /** Link URL pattern */
  linkTo?: string
  
  /** Whether to make the entire card clickable */
  clickable?: boolean
  
  /** Show different elements conditionally */
  show?: {
    author?: boolean
    category?: boolean
    tags?: boolean
    stats?: boolean
    excerpt?: boolean
    image?: boolean
    date?: boolean
    status?: boolean
  }

  /** Which stats to show */
  statsShow?: {
    views?: boolean
    likes?: boolean
    replies?: boolean
    bookmarks?: boolean
    shares?: boolean
  }
  
  /** Custom CSS classes */
  className?: string
  
  /** Optional header content (badges, icons, etc.) */
  headerContent?: ReactNode
  
  /** Optional footer content */
  footerContent?: ReactNode
  
  /** Custom image source */
  imageSrc?: string
  
  /** Image aspect ratio */
  imageAspect?: 'square' | 'video' | 'banner'
  
  /** Content truncation */
  truncate?: {
    title?: number
    excerpt?: number
  }
  
  /** Click handlers */
  onCardClick?: () => void
  onAuthorClick?: () => void
  onCategoryClick?: () => void
  
  /** Custom date formatter */
  formatDate?: (date: Date | string) => string
  
  /** Show loading skeleton */
  isLoading?: boolean
}

export const ContentCard = memo(function ContentCard({
  item,
  variant = 'default',
  theme = 'default',
  linkTo,
  clickable = true,
  show = {
    author: true,
    category: true,
    tags: true,
    stats: true,
    excerpt: true,
    image: false,
    date: true,
    status: false
  },
  statsShow = {
    views: true,
    likes: true,
    replies: true,
    bookmarks: false,
    shares: false
  },
  className = '',
  headerContent,
  footerContent,
  imageSrc,
  imageAspect = 'banner',
  truncate = {},
  onCardClick,
  onAuthorClick,
  onCategoryClick,
  formatDate,
  isLoading = false
}: ContentCardProps) {
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Get theme classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'minecraft':
        return 'minecraft-card bg-white border-2 border-slate-300 shadow-md hover:shadow-lg'
      case 'glass':
        return 'bg-white/90 backdrop-blur-sm border border-white/30 shadow-lg'
      case 'bordered':
        return 'bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300'
      default:
        return 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
    }
  }
  
  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-4'
      case 'featured':
        return 'p-8 shadow-xl'
      case 'minimal':
        return 'p-3'
      case 'grid':
        return 'p-5 h-full'
      case 'mini':
        return 'p-3'
      default:
        return 'p-6'
    }
  }
  
  // Truncate text helper
  const truncateText = (text: string, maxLength?: number) => {
    if (!maxLength || text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }
  
  // Format date helper with consistent timezone handling
  const formatDateDisplay = (date: Date | string) => {
    if (formatDate) return formatDate(date)
    
    // Use the utility function to ensure consistent formatting
    return formatSimpleDate(date).replace(/-/g, '/')
  }
  
  // Get link URL
  const getUrl = () => {
    if (linkTo) return linkTo
    if (item.slug) return `/${item.slug}` 
    if (item.id) return `/${item.id}`
    return '#'
  }
  
  // Status badge
  const renderStatusBadge = () => {
    if (!show.status || !item.status) return null
    
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status]}`}>
        {item.status}
      </span>
    )
  }
  
  // Special indicators
  const renderIndicators = () => {
    const indicators = []
    
    if (item.isPinned) {
      indicators.push(
        <span key="pinned" className="text-xs text-amber-600 font-medium">
          📌 Pinned
        </span>
      )
    }
    
    if (item.isLocked) {
      indicators.push(
        <span key="locked" className="text-xs text-red-600 font-medium">
          🔒 Locked
        </span>
      )
    }
    
    if (item.isFeatured) {
      indicators.push(
        <span key="featured" className="text-xs text-emerald-600 font-medium">
          ⭐ Featured
        </span>
      )
    }
    
    return indicators.length > 0 ? (
      <div className="flex items-center space-x-2">
        {indicators}
      </div>
    ) : null
  }
  
  // Card content
  const cardContent = (
    <div className={`${getThemeClasses()} ${getVariantClasses()} rounded-xl transition-all duration-300 ${
      clickable ? 'group cursor-pointer transform hover:scale-[1.02]' : ''
    } ${className}`}>
      
      {/* Optional Image */}
      {show.image && imageSrc && (
        <div className={`mb-4 overflow-hidden rounded-lg relative ${
          imageAspect === 'square' ? 'aspect-square' :
          imageAspect === 'video' ? 'aspect-video' : 'aspect-banner'
        }`}>
          <Image 
            src={imageSrc} 
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      
      {/* Header */}
      <div className={variant === 'mini' ? 'space-y-2' : 'space-y-3'}>
        {/* Custom header content or default */}
        {headerContent || (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title, Category, and Date on same line */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className={`font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2 flex-1 ${
                  variant === 'mini' ? 'text-base' : 'text-lg'
                }`}>
                  {truncateText(item.title, truncate.title)}
                </h3>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Date */}
                  {show.date && (item.publishedAt || item.createdAt) && (
                    <div className={`text-slate-500 flex items-center space-x-1 ${variant === 'mini' ? 'text-xs' : 'text-xs'}`}>
                      <Icon name="clock" className="w-3 h-3" />
                      <span>{formatDateDisplay(item.publishedAt || item.createdAt!)}</span>
                    </div>
                  )}
                  
                  {/* Category */}
                  {show.category && item.category && (
                    <CategoryBadge 
                      category={item.category}
                      size="sm"
                      onClick={onCategoryClick}
                    />
                  )}
                </div>
              </div>
              
              {/* Indicators and status row */}
              {(renderIndicators() || renderStatusBadge()) && (
                <div className={`flex items-center space-x-2 ${variant === 'mini' ? 'mb-1' : 'mb-2'}`}>
                  {/* Indicators */}
                  {renderIndicators()}
                  
                  {/* Status badge */}
                  {renderStatusBadge()}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Author only */}
        {show.author && (
          <div className={`text-sm ${variant === 'mini' ? 'text-xs' : ''}`}>
            <AuthorDisplay 
              name={item.author?.name || 'Anonymous'}
              avatar={item.author?.avatar}
              authorId={item.author?.id}
              size="sm"
              variant="compact"
              enableProfileLink={!!onAuthorClick}
            />
          </div>
        )}
        
        {/* Excerpt/Content - hidden in mini variant */}
        {show.excerpt && item.excerpt && variant !== 'mini' && (
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
            {truncateText(item.excerpt, truncate.excerpt || 150)}
          </p>
        )}
        
        {/* Footer: Tags and Stats */}
        <div className={`flex items-center justify-between border-t border-slate-100 ${
          variant === 'mini' ? 'pt-1.5' : 'pt-2'
        }`}>
          {/* Tags */}
          {show.tags && item.tags && item.tags.length > 0 ? (
            <TagList 
              tags={item.tags}
              size="sm"
              maxVisible={variant === 'mini' ? 1 : (variant === 'compact' ? 2 : 4)}
              enableLinks={false}
            />
          ) : <div />}
          
          {/* Stats */}
          {show.stats && item.stats && (
            <StatsDisplay 
              stats={item.stats}
              show={statsShow}
              variant="compact"
              size="sm"
            />
          )}
        </div>
        
        {/* Custom footer */}
        {footerContent}
      </div>
    </div>
  )
  
  // Handle click
  const handleClick = () => {
    onCardClick?.()
  }
  
  // Wrap with link if needed
  if (clickable && linkTo) {
    return (
      <Link href={getUrl()} onClick={handleClick}>
        {cardContent}
      </Link>
    )
  }
  
  if (clickable && onCardClick) {
    return (
      <div onClick={handleClick}>
        {cardContent}
      </div>
    )
  }
  
  return cardContent
})

export default ContentCard