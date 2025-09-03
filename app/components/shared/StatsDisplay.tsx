'use client'

import { memo, useMemo } from 'react'
import { Icon } from '@/app/components/ui/Icon'

export interface StatsDisplayProps {
  /** Statistics data */
  stats: {
    views?: number
    likes?: number
    replies?: number
    bookmarks?: number
    shares?: number
    comments?: number
  }
  
  /** Which stats to display */
  show?: {
    views?: boolean
    likes?: boolean
    replies?: boolean
    bookmarks?: boolean
    shares?: boolean
    comments?: boolean
  }
  
  /** Display variant */
  variant?: 'default' | 'compact' | 'detailed' | 'minimal'
  
  /** Size of the stats */
  size?: 'sm' | 'md' | 'lg'
  
  /** Layout direction */
  direction?: 'horizontal' | 'vertical'
  
  /** Show icons with stats */
  showIcons?: boolean
  
  /** Show labels with stats */
  showLabels?: boolean
  
  /** Custom CSS classes */
  className?: string
  
  /** Custom separator between stats */
  separator?: string | React.ReactNode
  
  /** Number formatting function */
  formatNumber?: (num: number) => string
  
  /** Custom icon mapping */
  customIcons?: {
    [key: string]: string
  }
  
  /** Custom labels */
  customLabels?: {
    [key: string]: string
  }
  
  /** Click handlers for individual stats */
  onStatClick?: (statType: string, value: number) => void
  
  /** Color scheme */
  colorScheme?: 'default' | 'muted' | 'colored'
  
  /** Maximum number of stats to show before truncating */
  maxVisible?: number
}

export const StatsDisplay = memo(function StatsDisplay({
  stats,
  show = {
    views: true,
    likes: true,
    replies: true,
    bookmarks: false,
    shares: false,
    comments: false
  },
  variant = 'default',
  size = 'md',
  direction = 'horizontal',
  showIcons = true,
  showLabels = false,
  className = '',
  separator = '•',
  formatNumber,
  customIcons = {},
  customLabels = {},
  onStatClick,
  colorScheme = 'default',
  maxVisible
}: StatsDisplayProps) {
  
  // Default number formatter
  const defaultFormatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }
  
  const formatter = formatNumber || defaultFormatNumber
  
  // Get visible stats
  const visibleStats = useMemo(() => {
    // Default icons mapping
    const defaultIcons = {
      views: 'eye',
      likes: 'heart',
      replies: 'chat',
      bookmarks: 'bookmark',
      shares: 'share',
      comments: 'chat',
      ...customIcons
    }
    
    // Default labels
    const defaultLabels = {
      views: 'Views',
      likes: 'Likes',
      replies: 'Replies',
      bookmarks: 'Bookmarks',
      shares: 'Shares',
      comments: 'Comments',
      ...customLabels
    }
  
    const statEntries = Object.entries(stats)
      .filter(([key, value]) => {
        // Only show stats that are enabled and have a value
        return show[key as keyof typeof show] && 
               typeof value === 'number' && 
               value >= 0
      })
      .map(([key, value]) => ({
        key,
        value: value as number,
        icon: defaultIcons[key as keyof typeof defaultIcons],
        label: defaultLabels[key as keyof typeof defaultLabels]
      }))
      .sort((a, b) => {
        // Sort by importance/common usage
        const order = ['views', 'likes', 'replies', 'comments', 'bookmarks', 'shares']
        return order.indexOf(a.key) - order.indexOf(b.key)
      })
    
    if (maxVisible) {
      return statEntries.slice(0, maxVisible)
    }
    
    return statEntries
  }, [stats, show, maxVisible, customIcons, customLabels])
  
  // Get size classes
  const sizeClasses = {
    sm: {
      text: 'text-xs',
      icon: 'w-3 h-3',
      spacing: 'space-x-1'
    },
    md: {
      text: 'text-sm',
      icon: 'w-4 h-4',
      spacing: 'space-x-2'
    },
    lg: {
      text: 'text-base',
      icon: 'w-5 h-5',
      spacing: 'space-x-3'
    }
  }
  
  // Get color classes
  const getColorClasses = (key: string) => {
    if (colorScheme === 'muted') {
      return 'text-slate-500'
    }
    
    if (colorScheme === 'colored') {
      const colorMap = {
        views: 'text-blue-600',
        likes: 'text-red-500',
        replies: 'text-green-600',
        bookmarks: 'text-yellow-600',
        shares: 'text-purple-600',
        comments: 'text-indigo-600'
      }
      return colorMap[key as keyof typeof colorMap] || 'text-slate-600'
    }
    
    return 'text-slate-600'
  }
  
  // Get layout classes
  const layoutClasses = {
    horizontal: `flex items-center ${sizeClasses[size].spacing}`,
    vertical: 'flex flex-col space-y-2'
  }
  
  // Render individual stat
  const renderStat = (stat: { key: string; value: number; icon: string; label: string }) => {
    const isClickable = !!onStatClick
    const colorClasses = getColorClasses(stat.key)
    
    const content = (
      <div className={`flex items-center space-x-1 ${colorClasses} ${
        isClickable ? 'hover:text-slate-800 cursor-pointer' : ''
      }`}>
        {showIcons && stat.icon && (
          <Icon 
            name={stat.icon} 
            className={`${sizeClasses[size].icon} flex-shrink-0`} 
          />
        )}
        
        <span className={`${sizeClasses[size].text} font-medium`}>
          {formatter(stat.value)}
        </span>
        
        {showLabels && (
          <span className={`${sizeClasses[size].text} opacity-75`}>
            {stat.label}
          </span>
        )}
      </div>
    )
    
    if (isClickable) {
      return (
        <button
          key={stat.key}
          type="button"
          className="flex items-center transition-colors"
          onClick={() => onStatClick(stat.key, stat.value)}
        >
          {content}
        </button>
      )
    }
    
    return <div key={stat.key}>{content}</div>
  }
  
  // Handle empty stats
  if (visibleStats.length === 0) {
    return null
  }
  
  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`${layoutClasses[direction]} ${className}`}>
        {visibleStats.map((stat) => (
          <span key={stat.key} className={`${sizeClasses[size].text} text-slate-500`}>
            {formatter(stat.value)}
          </span>
        ))}
      </div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <div className={`${layoutClasses[direction]} ${className}`}>
        {visibleStats.map((stat, index) => (
          <div key={stat.key} className="flex items-center">
            {renderStat(stat)}
            {index < visibleStats.length - 1 && separator && direction === 'horizontal' && (
              <span className={`text-slate-300 mx-2 ${sizeClasses[size].text}`}>
                {separator}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }
  
  if (variant === 'detailed') {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        {visibleStats.map((stat) => (
          <div key={stat.key} className="text-center p-3 bg-slate-50 rounded-lg">
            {showIcons && stat.icon && (
              <Icon 
                name={stat.icon} 
                className={`w-6 h-6 mx-auto mb-2 ${getColorClasses(stat.key)}`} 
              />
            )}
            <div className="text-lg font-bold text-slate-800">
              {formatter(stat.value)}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Default variant
  return (
    <div className={`${layoutClasses[direction]} ${className}`}>
      {visibleStats.map((stat, index) => (
        <div key={stat.key} className="flex items-center">
          {renderStat(stat)}
          {index < visibleStats.length - 1 && separator && direction === 'horizontal' && (
            <span className={`text-slate-300 mx-2 ${sizeClasses[size].text}`}>
              {separator}
            </span>
          )}
        </div>
      ))}
    </div>
  )
})

export default StatsDisplay