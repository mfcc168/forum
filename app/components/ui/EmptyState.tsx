'use client'

import React, { memo } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Icon } from './Icon'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  /** Title of the empty state */
  title: string
  /** Description text */
  description?: string
  /** Icon to display */
  icon?: string
  /** Primary action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Visual variant */
  variant?: 'default' | 'minimal' | 'card' | 'page'
  /** Size of the empty state */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Custom illustration */
  illustration?: React.ReactNode
}

export const EmptyState = memo(function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  className,
  illustration
}: EmptyStateProps) {
  const iconSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSize = {
    sm: {
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      title: 'text-lg',
      description: 'text-base'
    },
    lg: {
      title: 'text-xl',
      description: 'text-lg'
    }
  }

  const spacing = {
    sm: 'space-y-2 p-4',
    md: 'space-y-4 p-6',
    lg: 'space-y-6 p-8'
  }

  const content = (
    <div className={cn(
      'text-center',
      spacing[size],
      className
    )}>
      {/* Icon or Illustration */}
      <div className="mb-4">
        {illustration || (
          <div className={cn(
            'mx-auto mb-4 text-slate-400',
            iconSize[size]
          )}>
            <Icon name={icon} className={cn(iconSize[size])} />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-slate-900 mb-2',
        textSize[size].title
      )}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn(
          'text-slate-600 mb-6 max-w-md mx-auto',
          textSize[size].description
        )}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={cn(
          'flex gap-3 justify-center',
          size === 'sm' && 'flex-col items-center'
        )}>
          {action && (
            <Button
              onClick={action.onClick}
              variant="primary"
              size={size === 'lg' ? 'md' : 'sm'}
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'lg' ? 'md' : 'sm'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return <Card>{content}</Card>
  }

  if (variant === 'page') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md mx-auto">
          {content}
        </div>
      </div>
    )
  }

  return content
})

// Specialized empty state components
export const NoDataEmpty = memo(function NoDataEmpty({
  resource = 'data',
  onRefresh,
  variant = 'card'
}: {
  resource?: string
  onRefresh?: () => void
  variant?: EmptyStateProps['variant']
}) {
  return (
    <EmptyState
      title={`No ${resource} found`}
      description={`There is no ${resource.toLowerCase()} to display.`}
      icon="inbox"
      action={onRefresh ? {
        label: 'Refresh',
        onClick: onRefresh
      } : undefined}
      variant={variant}
    />
  )
})

export const NoResultsEmpty = memo(function NoResultsEmpty({
  searchQuery,
  onClearSearch,
  variant = 'default'
}: {
  searchQuery?: string
  onClearSearch?: () => void
  variant?: EmptyStateProps['variant']
}) {
  return (
    <EmptyState
      title="No results found"
      description={searchQuery 
        ? `No results found for "${searchQuery}". Try adjusting your search terms.`
        : "No results found. Try adjusting your search terms."
      }
      icon="search"
      action={onClearSearch ? {
        label: 'Clear Search',
        onClick: onClearSearch
      } : undefined}
      variant={variant}
    />
  )
})

export const NoPostsEmpty = memo(function NoPostsEmpty({
  onCreatePost,
  variant = 'card'
}: {
  onCreatePost?: () => void
  variant?: EmptyStateProps['variant']
}) {
  return (
    <EmptyState
      title="No posts yet"
      description="Be the first to start a discussion in this community!"
      icon="chat"
      action={onCreatePost ? {
        label: 'Create Post',
        onClick: onCreatePost
      } : undefined}
      variant={variant}
    />
  )
})

export const NoCommentsEmpty = memo(function NoCommentsEmpty({
  onAddComment,
  variant = 'minimal'
}: {
  onAddComment?: () => void
  variant?: EmptyStateProps['variant']
}) {
  return (
    <EmptyState
      title="No comments yet"
      description="Be the first to share your thoughts!"
      icon="messageCircle"
      size="sm"
      action={onAddComment ? {
        label: 'Add Comment',
        onClick: onAddComment
      } : undefined}
      variant={variant}
    />
  )
})

export const MaintenanceEmpty = memo(function MaintenanceEmpty({
  variant = 'page'
}: {
  variant?: EmptyStateProps['variant']
}) {
  return (
    <EmptyState
      title="Under Maintenance"
      description="This feature is temporarily unavailable while we make improvements. Please check back later."
      icon="tool"
      variant={variant}
      size="lg"
    />
  )
})

export const ComingSoonEmpty = memo(function ComingSoonEmpty({
  feature = 'feature',
  variant = 'card'
}: {
  feature?: string
  variant?: EmptyStateProps['variant']
}) {
  return (
    <EmptyState
      title="Coming Soon"
      description={`The ${feature} is currently in development and will be available soon.`}
      icon="clock"
      variant={variant}
    />
  )
})