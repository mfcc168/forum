'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Icon } from '@/app/components/ui/Icon'

export interface CategoryBadgeProps {
  /** Category information */
  category: {
    name: string
    slug?: string
    color?: string
    description?: string
    icon?: string
  } | string // Allow simple string for backward compatibility
  
  /** Badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  
  /** Visual variant */
  variant?: 'default' | 'outline' | 'solid' | 'minimal' | 'minecraft'
  
  /** Make badge clickable */
  clickable?: boolean
  
  /** Custom link pattern for category links */
  linkPattern?: string
  
  /** Show category icon if available */
  showIcon?: boolean
  
  /** Custom CSS classes */
  className?: string
  
  /** Color scheme override */
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray' | 'custom'
  
  /** Click handler */
  onClick?: () => void
  
  /** Custom color mapping function */
  getCustomColor?: (categoryName: string) => {
    background: string
    text: string
    border?: string
  }
  
  /** Translation function for category names */
  translateName?: (name: string) => string
}

export const CategoryBadge = memo(function CategoryBadge({
  category,
  size = 'md',
  variant = 'default',
  clickable = false,
  linkPattern = '/category/{slug}',
  showIcon = false,
  className = '',
  colorScheme = 'blue',
  onClick,
  getCustomColor,
  translateName
}: CategoryBadgeProps) {
  
  // Normalize category to object format
  const categoryObj = typeof category === 'string' 
    ? { name: category } 
    : category
  
  // Get translated name
  const displayName = translateName 
    ? translateName(categoryObj.name) 
    : categoryObj.name
  
  // Get size classes
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }
  
  // Get icon size
  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3', 
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }
  
  // Get color classes
  const getColorClasses = () => {
    // Use custom color if provided
    if (categoryObj.color && colorScheme === 'custom') {
      return {
        background: categoryObj.color,
        text: 'text-white',
        border: categoryObj.color
      }
    }
    
    // Use custom color function
    if (getCustomColor) {
      return getCustomColor(categoryObj.name)
    }
    
    // Default color schemes
    const colorSchemes = {
      blue: {
        default: 'bg-blue-100 text-blue-800 border-blue-200',
        outline: 'bg-transparent text-blue-700 border-blue-300',
        solid: 'bg-blue-500 text-white border-blue-500',
        minimal: 'bg-transparent text-blue-600'
      },
      green: {
        default: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        outline: 'bg-transparent text-emerald-700 border-emerald-300',
        solid: 'bg-emerald-500 text-white border-emerald-500',
        minimal: 'bg-transparent text-emerald-600'
      },
      purple: {
        default: 'bg-purple-100 text-purple-800 border-purple-200',
        outline: 'bg-transparent text-purple-700 border-purple-300',
        solid: 'bg-purple-500 text-white border-purple-500',
        minimal: 'bg-transparent text-purple-600'
      },
      orange: {
        default: 'bg-orange-100 text-orange-800 border-orange-200',
        outline: 'bg-transparent text-orange-700 border-orange-300',
        solid: 'bg-orange-500 text-white border-orange-500',
        minimal: 'bg-transparent text-orange-600'
      },
      red: {
        default: 'bg-red-100 text-red-800 border-red-200',
        outline: 'bg-transparent text-red-700 border-red-300',
        solid: 'bg-red-500 text-white border-red-500',
        minimal: 'bg-transparent text-red-600'
      },
      gray: {
        default: 'bg-slate-100 text-slate-800 border-slate-200',
        outline: 'bg-transparent text-slate-700 border-slate-300',
        solid: 'bg-slate-500 text-white border-slate-500',
        minimal: 'bg-transparent text-slate-600'
      },
      custom: {
        default: 'bg-slate-100 text-slate-800 border-slate-200',
        outline: 'bg-transparent text-slate-700 border-slate-300',
        solid: 'bg-slate-500 text-white border-slate-500',
        minimal: 'bg-transparent text-slate-600'
      }
    }
    
    // Handle minecraft variant separately since it's not in color schemes
    if (variant === 'minecraft') {
      return 'minecraft-badge-colors' // Will be handled by CSS
    }
    
    const scheme = colorSchemes[colorScheme]
    if (!scheme) return colorSchemes.blue.default
    
    // Type-safe variant access
    const variantClass = scheme[variant as keyof typeof scheme]
    return variantClass || scheme.default
  }
  
  // Get base classes
  const getBaseClasses = () => {
    const baseClass = `inline-flex items-center font-medium rounded-full transition-all duration-200 ${sizeClasses[size]}`
    
    if (variant === 'minecraft') {
      return `${baseClass} minecraft-badge`
    }
    
    if (variant === 'minimal') {
      return `${baseClass} ${getColorClasses()}`
    }
    
    if (variant === 'outline') {
      return `${baseClass} border ${getColorClasses()}`
    }
    
    return `${baseClass} border ${getColorClasses()}`
  }
  
  // Get hover classes if clickable
  const getHoverClasses = () => {
    if (!clickable && !onClick) return ''
    
    if (variant === 'solid') {
      return 'hover:opacity-90 cursor-pointer'
    }
    
    if (variant === 'outline') {
      return 'hover:bg-current hover:bg-opacity-10 cursor-pointer'
    }
    
    return 'hover:bg-current hover:bg-opacity-10 cursor-pointer'
  }
  
  // Generate category URL
  const getCategoryUrl = () => {
    if (!categoryObj.slug) return '#'
    return linkPattern.replace('{slug}', categoryObj.slug)
  }
  
  // Badge content
  const badgeContent = (
    <span className={`${getBaseClasses()} ${getHoverClasses()} ${className}`}>
      {showIcon && categoryObj.icon && (
        <Icon 
          name={categoryObj.icon} 
          className={`${iconSizes[size]} mr-1`} 
        />
      )}
      
      <span className="truncate">
        {displayName}
      </span>
    </span>
  )
  
  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }
  
  // Wrap with link if clickable and has slug
  if (clickable && categoryObj.slug) {
    return (
      <Link 
        href={getCategoryUrl()}
        onClick={handleClick}
        className="inline-block"
        title={categoryObj.description || `View ${displayName} category`}
      >
        {badgeContent}
      </Link>
    )
  }
  
  // Wrap with button if has onClick
  if (onClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-block"
        title={categoryObj.description || displayName}
      >
        {badgeContent}
      </button>
    )
  }
  
  // Static badge
  return (
    <span title={categoryObj.description || displayName}>
      {badgeContent}
    </span>
  )
})

export default CategoryBadge