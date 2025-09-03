import React from 'react'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Icon } from '@/app/components/ui/Icon'
import { cn } from '@/lib/utils'
import { ErrorStateProps } from '@/lib/types'

export function ErrorState({ 
  title = 'Something went wrong',
  error = 'An unexpected error occurred. Please try again.',
  onRetry,
  showReload = false,
  variant = 'card',
  className
}: ErrorStateProps) {
  const content = (
    <div className={cn(
      'text-center',
      variant === 'inline' && 'py-6',
      variant === 'page' && 'py-12 px-4',
      variant === 'card' && 'p-8',
      className
    )}>
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto mb-4 text-red-500">
          <Icon name="alertTriangle" className="w-12 h-12" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        {error}
      </p>
      
      <div className="flex gap-2 justify-center">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="primary"
          >
            Try Again
          </Button>
        )}
        
        {showReload && (
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload Page
          </Button>
        )}
      </div>
    </div>
  )

  if (variant === 'card') {
    return (
      <Card>
        {content}
      </Card>
    )
  }

  return content
}

// Specialized error components
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      error="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      variant="card"
    />
  )
}

export function NotFoundError({ 
  resource = 'content',
  onGoBack 
}: { 
  resource?: string
  onGoBack?: () => void 
}) {
  return (
    <ErrorState
      title={`${resource} Not Found`}
      error={`The ${resource.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      onRetry={onGoBack}
      variant="card"
    />
  )
}

export function UnauthorizedError({ onLogin }: { onLogin?: () => void }) {
  return (
    <ErrorState
      title="Access Denied"
      error="You need to be logged in to access this content."
      onRetry={onLogin}
      variant="card"
    />
  )
}