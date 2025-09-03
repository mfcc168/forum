'use client'

import React, { memo, useCallback } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Icon } from './Icon'
import { cn } from '@/lib/utils'

// Enhanced error state props
export interface ErrorStateEnhancedProps {
  /** Error title */
  title?: string
  /** Error message */
  message: string
  /** Error type for styling */
  type?: 'error' | 'warning' | 'info' | 'network' | 'not-found' | 'unauthorized' | 'server'
  /** Variant for different layouts */
  variant?: 'default' | 'minimal' | 'card' | 'page' | 'inline'
  /** Size of the error state */
  size?: 'sm' | 'md' | 'lg'
  /** Primary action button */
  primaryAction?: {
    label: string
    onClick: () => void | Promise<void>
    loading?: boolean
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void | Promise<void>
  }
  /** Retry functionality */
  onRetry?: () => void | Promise<void>
  /** Show details toggle */
  details?: string | Error
  /** Custom icon */
  icon?: string
  /** Additional CSS classes */
  className?: string
  /** Hide icon */
  hideIcon?: boolean
  /** Show reload button */
  showReload?: boolean
}

// Error type configurations
const errorConfigs = {
  error: {
    icon: 'alertTriangle',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    defaultTitle: 'Something went wrong'
  },
  warning: {
    icon: 'alertCircle',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    defaultTitle: 'Warning'
  },
  info: {
    icon: 'info',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    defaultTitle: 'Information'
  },
  network: {
    icon: 'wifi',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    defaultTitle: 'Connection Error'
  },
  'not-found': {
    icon: 'search',
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    defaultTitle: 'Not Found'
  },
  unauthorized: {
    icon: 'lock',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    defaultTitle: 'Access Denied'
  },
  server: {
    icon: 'server',
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    defaultTitle: 'Server Error'
  }
}

export const ErrorStateEnhanced = memo(function ErrorStateEnhanced({
  title,
  message,
  type = 'error',
  variant = 'default',
  size = 'md',
  primaryAction,
  secondaryAction,
  onRetry,
  details,
  icon,
  className,
  hideIcon = false,
  showReload = false
}: ErrorStateEnhancedProps) {
  const config = errorConfigs[type]
  const errorTitle = title || config.defaultTitle

  const [showDetails, setShowDetails] = React.useState(false)
  const [retryLoading, setRetryLoading] = React.useState(false)

  const handleRetry = useCallback(async () => {
    if (!onRetry) return
    
    setRetryLoading(true)
    try {
      await onRetry()
    } finally {
      setRetryLoading(false)
    }
  }, [onRetry])

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  const iconSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSize = {
    sm: {
      title: 'text-base',
      message: 'text-sm'
    },
    md: {
      title: 'text-lg',
      message: 'text-base'
    },
    lg: {
      title: 'text-xl',
      message: 'text-lg'
    }
  }

  const padding = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const content = (
    <div className={cn(
      'text-center',
      variant === 'inline' && 'text-left flex items-start space-x-3',
      variant === 'minimal' && 'space-y-2',
      variant !== 'minimal' && variant !== 'inline' && 'space-y-4',
      padding[size],
      className
    )}>
      {/* Icon */}
      {!hideIcon && (
        <div className={cn(
          variant === 'inline' ? 'flex-shrink-0 mt-1' : 'mx-auto',
          variant !== 'inline' && 'mb-4'
        )}>
          <Icon 
            name={icon || config.icon} 
            className={cn(
              iconSize[size],
              config.iconColor,
              variant === 'inline' && 'w-5 h-5'
            )} 
          />
        </div>
      )}

      <div className={cn(variant === 'inline' && 'flex-1')}>
        {/* Title */}
        <h3 className={cn(
          'font-semibold text-slate-900 mb-2',
          textSize[size].title
        )}>
          {errorTitle}
        </h3>

        {/* Message */}
        <p className={cn(
          'text-slate-600 mb-4',
          textSize[size].message,
          variant === 'inline' && 'mb-2'
        )}>
          {message}
        </p>

        {/* Details Toggle */}
        {details && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            
            {showDetails && (
              <div className={cn(
                'mt-3 p-3 text-left text-xs rounded-lg',
                config.bgColor,
                config.borderColor,
                'border'
              )}>
                <pre className="whitespace-pre-wrap font-mono text-slate-700">
                  {typeof details === 'string' 
                    ? details 
                    : details instanceof Error 
                      ? `${details.name}: ${details.message}\n${details.stack}`
                      : JSON.stringify(details, null, 2)
                  }
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {(primaryAction || secondaryAction || onRetry || showReload) && (
          <div className={cn(
            'flex gap-3',
            variant === 'inline' ? 'justify-start' : 'justify-center',
            size === 'sm' && 'flex-col space-y-2'
          )}>
            {/* Primary Action */}
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                variant="primary"
                size={size === 'lg' ? 'md' : 'sm'}
                isLoading={primaryAction.loading}
              >
                {primaryAction.label}
              </Button>
            )}

            {/* Retry Button */}
            {onRetry && (
              <Button
                onClick={handleRetry}
                variant={primaryAction ? "outline" : "primary"}
                size={size === 'lg' ? 'md' : 'sm'}
                isLoading={retryLoading}
              >
                Try Again
              </Button>
            )}

            {/* Secondary Action */}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                size={size === 'lg' ? 'md' : 'sm'}
              >
                {secondaryAction.label}
              </Button>
            )}

            {/* Reload Button */}
            {showReload && (
              <Button
                onClick={handleReload}
                variant="outline"
                size={size === 'lg' ? 'md' : 'sm'}
              >
                Reload Page
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Return based on variant
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

// Specialized error components
export const NetworkError = memo(function NetworkError({ 
  onRetry,
  variant = 'card',
  size = 'md'
}: { 
  onRetry?: () => void
  variant?: ErrorStateEnhancedProps['variant']
  size?: ErrorStateEnhancedProps['size']
}) {
  return (
    <ErrorStateEnhanced
      type="network"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      variant={variant}
      size={size}
      showReload
    />
  )
})

export const NotFoundError = memo(function NotFoundError({ 
  resource = 'content',
  onGoBack,
  variant = 'page',
  size = 'md'
}: { 
  resource?: string
  onGoBack?: () => void
  variant?: ErrorStateEnhancedProps['variant']
  size?: ErrorStateEnhancedProps['size']
}) {
  return (
    <ErrorStateEnhanced
      type="not-found"
      title={`${resource} Not Found`}
      message={`The ${resource.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      primaryAction={onGoBack ? {
        label: 'Go Back',
        onClick: onGoBack
      } : undefined}
      variant={variant}
      size={size}
    />
  )
})

export const UnauthorizedError = memo(function UnauthorizedError({ 
  onLogin,
  variant = 'card',
  size = 'md'
}: { 
  onLogin?: () => void
  variant?: ErrorStateEnhancedProps['variant']
  size?: ErrorStateEnhancedProps['size']
}) {
  return (
    <ErrorStateEnhanced
      type="unauthorized"
      message="You need to be logged in to access this content."
      primaryAction={onLogin ? {
        label: 'Sign In',
        onClick: onLogin
      } : undefined}
      variant={variant}
      size={size}
    />
  )
})

export const ServerError = memo(function ServerError({ 
  onRetry,
  details,
  variant = 'card',
  size = 'md'
}: { 
  onRetry?: () => void
  details?: string | Error
  variant?: ErrorStateEnhancedProps['variant']
  size?: ErrorStateEnhancedProps['size']
}) {
  return (
    <ErrorStateEnhanced
      type="server"
      title="Server Error"
      message="The server encountered an error while processing your request."
      onRetry={onRetry}
      details={details}
      variant={variant}
      size={size}
      showReload
    />
  )
})

export const ValidationError = memo(function ValidationError({ 
  errors,
  onDismiss,
  variant = 'inline'
}: { 
  errors: string | string[]
  onDismiss?: () => void
  variant?: ErrorStateEnhancedProps['variant']
}) {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors
  
  return (
    <ErrorStateEnhanced
      type="warning"
      title="Validation Error"
      message={errorMessage}
      size="sm"
      variant={variant}
      secondaryAction={onDismiss ? {
        label: 'Dismiss',
        onClick: onDismiss
      } : undefined}
    />
  )
})