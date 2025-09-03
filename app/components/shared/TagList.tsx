'use client'

import { memo, useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from '@/app/components/ui/Icon'

export interface TagListProps {
  /** Array of tag strings */
  tags: string[]
  
  /** Maximum number of tags to display before showing "show more" */
  maxVisible?: number
  
  /** Size variant for tags */
  size?: 'sm' | 'md' | 'lg'
  
  /** Visual variant */
  variant?: 'default' | 'outline' | 'solid' | 'minimal'
  
  /** Color scheme - can be overridden per tag */
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
  
  /** Make tags clickable with custom URL pattern */
  enableLinks?: boolean
  
  /** URL pattern for tag links (use {tag} placeholder) */
  linkPattern?: string
  
  /** Show a prefix icon for each tag */
  showIcon?: boolean
  
  /** Icon name to show (from your Icon component) */
  iconName?: string
  
  /** Custom CSS classes */
  className?: string
  
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
  
  /** Wrap tags to multiple lines */
  wrap?: boolean
  
  /** Show empty state when no tags */
  showEmptyState?: boolean
  
  /** Custom empty state message */
  emptyMessage?: string
  
  /** Click handler for individual tags */
  onTagClick?: (tag: string) => void
  
  /** Color mapping function for custom tag colors */
  getTagColor?: (tag: string) => string
  
  /** Filter function to determine which tags to show */
  filterTags?: (tag: string) => boolean
}

export const TagList = memo(function TagList({
  tags,
  maxVisible,
  size = 'md',
  variant = 'default',
  colorScheme = 'blue',
  enableLinks = false,
  linkPattern = '/search?tag={tag}',
  showIcon = false,
  iconName = 'tag',
  className = '',
  direction = 'horizontal',
  wrap = true,
  showEmptyState = false,
  emptyMessage = 'No tags',
  onTagClick,
  getTagColor,
  filterTags
}: TagListProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Filter and process tags
  const processedTags = useMemo(() => {
    let filtered = tags.filter(tag => tag && tag.trim().length > 0)
    
    if (filterTags) {
      filtered = filtered.filter(filterTags)
    }
    
    // Remove duplicates and sort
    return [...new Set(filtered)].sort()
  }, [tags, filterTags])
  
  // Determine visible tags
  const visibleTags = useMemo(() => {
    if (!maxVisible || showAll) {
      return processedTags
    }
    return processedTags.slice(0, maxVisible)
  }, [processedTags, maxVisible, showAll])
  
  const hasMoreTags = maxVisible && processedTags.length > maxVisible
  
  // Get size-based classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5', 
    lg: 'text-base px-3 py-2'
  }
  
  // Get color scheme classes
  const getColorClasses = (tag: string) => {
    // Use custom color function if provided
    const customColor = getTagColor?.(tag)
    if (customColor) {
      return `bg-${customColor}-100 text-${customColor}-800 border-${customColor}-200`
    }
    
    // Use predefined color scheme
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      green: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      gray: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
    }
    
    return colorClasses[colorScheme]
  }
  
  // Get variant-based classes
  const getVariantClasses = (tag: string) => {
    const baseClasses = 'inline-flex items-center font-medium transition-colors duration-200'
    const colorClasses = getColorClasses(tag)
    
    switch (variant) {
      case 'outline':
        return `${baseClasses} ${colorClasses} border bg-transparent`
      case 'solid':
        return `${baseClasses} ${colorClasses} border-0`
      case 'minimal':
        return `${baseClasses} ${colorClasses} border-0 bg-transparent`
      default:
        return `${baseClasses} ${colorClasses} border`
    }
  }
  
  // Generate tag URL
  const getTagUrl = (tag: string) => {
    return linkPattern.replace('{tag}', encodeURIComponent(tag))
  }
  
  // Handle tag click
  const handleTagClick = (tag: string) => {
    onTagClick?.(tag)
  }
  
  // Render individual tag
  const renderTag = (tag: string, index: number) => {
    const tagClasses = `${getVariantClasses(tag)} ${sizeClasses[size]} rounded-full`
    const isClickable = enableLinks || onTagClick
    
    const content = (
      <>
        {showIcon && (
          <Icon name={iconName} className="w-3 h-3 mr-1" />
        )}
        <span className={variant === 'minimal' ? 'underline' : ''}>{tag}</span>
      </>
    )
    
    if (enableLinks) {
      return (
        <Link
          key={`${tag}-${index}`}
          href={getTagUrl(tag)}
          className={`${tagClasses} ${isClickable ? 'cursor-pointer' : ''}`}
          onClick={() => handleTagClick(tag)}
        >
          {content}
        </Link>
      )
    }
    
    if (onTagClick) {
      return (
        <button
          key={`${tag}-${index}`}
          type="button"
          className={`${tagClasses} cursor-pointer`}
          onClick={() => handleTagClick(tag)}
        >
          {content}
        </button>
      )
    }
    
    return (
      <span key={`${tag}-${index}`} className={tagClasses}>
        {content}
      </span>
    )
  }
  
  // Handle empty state
  if (processedTags.length === 0) {
    if (!showEmptyState) return null
    
    return (
      <div className={`text-slate-500 text-sm italic ${className}`}>
        {emptyMessage}
      </div>
    )
  }
  
  // Layout classes
  const layoutClasses = {
    horizontal: `flex items-center ${wrap ? 'flex-wrap' : ''} gap-2`,
    vertical: 'flex flex-col gap-2'
  }
  
  return (
    <div className={`${layoutClasses[direction]} ${className}`}>
      {visibleTags.map((tag, index) => renderTag(tag, index))}
      
      {hasMoreTags && (
        <button
          type="button"
          className={`${sizeClasses[size]} text-slate-600 hover:text-slate-800 underline font-medium`}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : `+${processedTags.length - maxVisible!} more`}
        </button>
      )}
    </div>
  )
})

export default TagList