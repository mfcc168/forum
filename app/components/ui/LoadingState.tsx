'use client'

import React, { memo } from 'react'
import { LoadingSpinner, Skeleton } from './LoadingSpinner'
import { Card } from './Card'
import { cn } from '@/lib/utils'

// Enhanced loading state props
export interface LoadingStateProps {
  /** Type of loading state to show */
  variant?: 'spinner' | 'skeleton' | 'shimmer' | 'pulse'
  /** Size of the loading indicator */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Custom message to display */
  message?: string
  /** Show loading message */
  showMessage?: boolean
  /** Additional CSS classes */
  className?: string
  /** Container variant */
  container?: 'none' | 'card' | 'page'
  /** Layout for skeleton loading */
  layout?: 'list' | 'card' | 'form' | 'content' | 'grid'
  /** Number of skeleton items to show */
  count?: number
}

// Spinner loading component
export const SpinnerLoading = memo(function SpinnerLoading({
  size = 'md',
  message,
  showMessage = true,
  className,
  container = 'none'
}: LoadingStateProps) {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-3',
      size === 'sm' && 'py-4',
      size === 'md' && 'py-8', 
      size === 'lg' && 'py-12',
      size === 'xl' && 'py-16',
      className
    )}>
      <LoadingSpinner size={size} />
      {showMessage && (
        <p className={cn(
          'text-slate-600 animate-pulse',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
          size === 'xl' && 'text-xl'
        )}>
          {message || 'Loading...'}
        </p>
      )}
    </div>
  )

  if (container === 'card') {
    return <Card className="text-center">{content}</Card>
  }

  if (container === 'page') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
})

// Skeleton loading layouts
export const SkeletonLoading = memo(function SkeletonLoading({
  layout = 'list',
  count = 3,
  className,
  container = 'none'
}: LoadingStateProps) {
  const renderSkeleton = () => {
    switch (layout) {
      case 'list':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )

      case 'card':
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        )

      case 'form':
        return (
          <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex space-x-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        )

      case 'content':
        return (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        )

      case 'grid':
        return (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        )
    }
  }

  const content = (
    <div className={cn('animate-pulse', className)}>
      {renderSkeleton()}
    </div>
  )

  if (container === 'card') {
    return <Card className="p-6">{content}</Card>
  }

  return content
})

// Shimmer loading effect
export const ShimmerLoading = memo(function ShimmerLoading({
  className,
  container = 'none'
}: LoadingStateProps) {
  const content = (
    <div className={cn(
      'relative overflow-hidden bg-slate-200 rounded-lg',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
      'before:animate-shimmer',
      className
    )}>
      <div className="h-32 w-full" />
    </div>
  )

  if (container === 'card') {
    return <Card>{content}</Card>
  }

  return content
})

// Pulse loading effect
export const PulseLoading = memo(function PulseLoading({
  className,
  container = 'none',
  children
}: LoadingStateProps & { children?: React.ReactNode }) {
  const content = (
    <div className={cn('animate-pulse opacity-50', className)}>
      {children || <div className="h-32 bg-slate-200 rounded" />}
    </div>
  )

  if (container === 'card') {
    return <Card>{content}</Card>
  }

  return content
})

// Main LoadingState component that switches between variants
export const LoadingState = memo(function LoadingState(props: LoadingStateProps) {
  const { variant = 'spinner' } = props

  switch (variant) {
    case 'skeleton':
      return <SkeletonLoading {...props} />
    case 'shimmer':
      return <ShimmerLoading {...props} />
    case 'pulse':
      return <PulseLoading {...props} />
    case 'spinner':
    default:
      return <SpinnerLoading {...props} />
  }
})

// Specialized loading components for common use cases
export const PageLoading = memo(function PageLoading({
  message = 'Loading page...'
}: { message?: string }) {
  return (
    <LoadingState
      variant="spinner"
      size="lg"
      message={message}
      container="page"
    />
  )
})

export const ContentLoading = memo(function ContentLoading({
  layout = 'content',
  count = 1
}: { layout?: LoadingStateProps['layout']; count?: number }) {
  return (
    <LoadingState
      variant="skeleton"
      layout={layout}
      count={count}
      container="card"
    />
  )
})

export const ListLoading = memo(function ListLoading({
  count = 5
}: { count?: number }) {
  return (
    <LoadingState
      variant="skeleton"
      layout="list"
      count={count}
    />
  )
})

export const FormLoading = memo(function FormLoading({
  count = 4
}: { count?: number }) {
  return (
    <LoadingState
      variant="skeleton"
      layout="form"
      count={count}
      container="card"
    />
  )
})

export const GridLoading = memo(function GridLoading({
  count = 6
}: { count?: number }) {
  return (
    <LoadingState
      variant="skeleton"
      layout="grid"
      count={count}
    />
  )
})

// Button loading state
export const ButtonLoading = memo(function ButtonLoading({
  size = 'sm',
  className
}: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <LoadingSpinner 
      size={size} 
      color="white" 
      className={className}
    />
  )
})