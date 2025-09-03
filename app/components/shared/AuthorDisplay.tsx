'use client'

import { memo, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface AuthorDisplayProps {
  /** Author's name */
  name: string
  
  /** Author's avatar URL (optional) */
  avatar?: string | null
  
  /** Author's unique identifier for profile linking */
  authorId?: string
  
  /** Display size variant */
  size?: 'sm' | 'md' | 'lg'
  
  /** Layout variant */
  variant?: 'horizontal' | 'vertical' | 'compact'
  
  /** Show online status indicator */
  showOnlineStatus?: boolean
  
  /** Whether the author is currently online */
  isOnline?: boolean
  
  /** Additional information to display (e.g., role, join date) */
  subtitle?: string
  
  /** Custom CSS classes */
  className?: string
  
  /** Whether to make the author name/avatar clickable */
  enableProfileLink?: boolean
  
  /** Custom profile URL pattern (defaults to /user/{authorId}) */
  profileUrlPattern?: string
  
  /** Show fallback initials when no avatar */
  showInitials?: boolean
  
  /** Custom fallback avatar component */
  fallbackAvatar?: React.ReactNode
}

export const AuthorDisplay = memo(function AuthorDisplay({
  name,
  avatar,
  authorId,
  size = 'md',
  variant = 'horizontal',
  showOnlineStatus = false,
  isOnline = false,
  subtitle,
  className = '',
  enableProfileLink = true,
  profileUrlPattern = '/user/{authorId}',
  showInitials = true,
  fallbackAvatar
}: AuthorDisplayProps) {
  const [imageError, setImageError] = useState(false)
  
  // Handle image load errors
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])
  
  // Get size-based classes
  const sizeClasses = {
    sm: {
      avatar: 'w-6 h-6',
      text: 'text-sm',
      subtitle: 'text-xs'
    },
    md: {
      avatar: 'w-8 h-8',
      text: 'text-sm',
      subtitle: 'text-xs'
    },
    lg: {
      avatar: 'w-12 h-12',
      text: 'text-base',
      subtitle: 'text-sm'
    }
  }
  
  // Get variant-based layout classes
  const variantClasses = {
    horizontal: 'flex items-center space-x-2',
    vertical: 'flex flex-col items-center text-center space-y-1',
    compact: 'flex items-center space-x-1'
  }
  
  // Generate initials from name
  const getInitials = (fullName: string) => {
    if (!fullName || typeof fullName !== 'string') {
      return '?'
    }
    return fullName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }
  
  // Generate profile URL
  const profileUrl = authorId 
    ? profileUrlPattern.replace('{authorId}', authorId)
    : null
  
  // Avatar component with fallback
  const renderAvatar = () => {
    const baseClasses = `${sizeClasses[size].avatar} rounded-full flex-shrink-0`
    
    if (fallbackAvatar && (imageError || !avatar)) {
      return <div className={baseClasses}>{fallbackAvatar}</div>
    }
    
    if (!avatar || imageError) {
      if (!showInitials) return null
      
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-medium flex items-center justify-center`}>
          <span className={size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}>
            {getInitials(name)}
          </span>
        </div>
      )
    }
    
    // Get numeric size for Image component
    const imageSizes = {
      sm: 24,  // 6 * 4 = 24px (w-6 = 1.5rem = 24px)
      md: 32,  // 8 * 4 = 32px (w-8 = 2rem = 32px)
      lg: 48   // 12 * 4 = 48px (w-12 = 3rem = 48px)
    }
    
    return (
      <div className={`${baseClasses} relative`}>
        <Image
          src={avatar}
          alt={`${name}'s avatar`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className={`${baseClasses} object-cover`}
          onError={handleImageError}
          loading="lazy"
        />
        
        {showOnlineStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white ${
            size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
          } ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
        )}
      </div>
    )
  }
  
  // Author info component
  const renderAuthorInfo = () => {
    const content = (
      <div className={variant === 'vertical' ? 'text-center' : 'min-w-0 flex-1'}>
        <div className={`font-medium text-slate-800 ${sizeClasses[size].text} ${
          variant === 'compact' ? 'truncate' : ''
        }`}>
          {name || 'Unknown Author'}
        </div>
        
        {subtitle && (
          <div className={`text-slate-500 ${sizeClasses[size].subtitle} ${
            variant === 'compact' ? 'truncate' : ''
          }`}>
            {subtitle}
          </div>
        )}
      </div>
    )
    
    // Wrap in link if profile linking is enabled
    if (enableProfileLink && profileUrl) {
      return (
        <Link 
          href={profileUrl}
          className="hover:text-emerald-600 transition-colors min-w-0 flex-1"
        >
          {content}
        </Link>
      )
    }
    
    return content
  }
  
  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {enableProfileLink && profileUrl ? (
        <Link href={profileUrl} className="flex-shrink-0">
          {renderAvatar()}
        </Link>
      ) : (
        renderAvatar()
      )}
      
      {renderAuthorInfo()}
    </div>
  )
})

export default AuthorDisplay