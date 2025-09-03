'use client'

import React, { memo, ReactNode } from 'react'
import { LoadingState } from './LoadingState'
import { ErrorStateEnhanced, NetworkError, NotFoundError, UnauthorizedError } from './ErrorStateEnhanced'
import { EmptyState } from './EmptyState'
import type { QueryState, MutationState } from '@/lib/types'
import { isNetworkError, isNotFoundError, isAuthError, formatErrorMessage } from '@/lib/hooks/useQueryState'

export interface StateRendererProps<T = unknown> {
  /** Query state object - supports both QueryState and React Query results */
  state: QueryState<T> | MutationState<T> | {
    data: T | undefined
    isLoading: boolean
    error: Error | null
    refetch?: () => void | Promise<unknown>
  }
  /** Content to render when ready */
  children: ReactNode | ((data: T | unknown) => ReactNode)
  /** Loading state configuration */
  loading?: {
    variant?: 'spinner' | 'skeleton' | 'shimmer' | 'pulse'
    layout?: 'list' | 'card' | 'form' | 'content' | 'grid'
    container?: 'none' | 'card' | 'page'
    message?: string
    count?: number
    size?: 'sm' | 'md' | 'lg'
  }
  /** Error state configuration */
  error?: {
    variant?: 'default' | 'minimal' | 'card' | 'page' | 'inline'
    size?: 'sm' | 'md' | 'lg'
    showDetails?: boolean
    showReload?: boolean
    onRetry?: () => void
    onGoBack?: () => void
    onLogin?: () => void
  }
  /** Empty state configuration */
  empty?: {
    title?: string
    description?: string
    icon?: string
    action?: {
      label: string
      onClick: () => void
    }
    variant?: 'default' | 'minimal' | 'card'
  }
  /** Custom empty check function */
  isEmpty?: (data: unknown) => boolean
  /** Force show loading state */
  forceLoading?: boolean
  /** Force show error state */
  forceError?: string | Error
}

/**
 * StateRenderer component that handles loading, error, empty, and success states
 */
export const StateRenderer = memo(function StateRenderer<T = unknown>({
  state,
  children,
  loading = {},
  error = {},
  empty = {},
  isEmpty: customIsEmpty,
  forceLoading = false,
  forceError
}: StateRendererProps<T>) {
  // Normalize state to handle both QueryState and React Query result formats
  const normalizedState = {
    isLoading: state.isLoading,
    isError: 'isError' in state ? state.isError : !!state.error,
    isSuccess: 'isSuccess' in state ? state.isSuccess : !!state.data && !state.error,
    error: state.error,
    data: state.data,
    retry: 'retry' in state ? state.retry : ('refetch' in state ? state.refetch : undefined)
  }
  
  const {
    variant: loadingVariant = 'skeleton',
    layout = 'content',
    container = 'none',
    message = 'Loading...',
    count = 3,
    size: loadingSize = 'md'
  } = loading

  const {
    variant: errorVariant = 'card',
    size: errorSize = 'md',
    showDetails = process.env.NODE_ENV === 'development',
    showReload = false,
    onRetry,
    onGoBack,
    onLogin
  } = error

  const {
    title: emptyTitle = 'No data found',
    description: emptyDescription = 'There is no data to display.',
    icon: emptyIcon = 'inbox',
    action: emptyAction,
    variant: emptyVariant = 'card'
  } = empty

  // Force states for testing/demos
  if (forceLoading) {
    return (
      <LoadingState
        variant={loadingVariant}
        layout={layout}
        container={container}
        message={message}
        count={count}
        size={loadingSize}
      />
    )
  }

  if (forceError) {
    const errorObj = typeof forceError === 'string' ? new Error(forceError) : forceError
    return (
      <ErrorStateEnhanced
        type="error"
        message={formatErrorMessage(errorObj)}
        variant={errorVariant}
        size={errorSize}
        details={showDetails ? errorObj : undefined}
        onRetry={onRetry}
        showReload={showReload}
      />
    )
  }

  // Loading state
  if (normalizedState.isLoading && !normalizedState.data) {
    return (
      <LoadingState
        variant={loadingVariant}
        layout={layout}
        container={container}
        message={message}
        count={count}
        size={loadingSize}
      />
    )
  }

  // Error state
  if (normalizedState.isError && normalizedState.error) {
    // Handle specific error types with specialized components
    if (isNetworkError(normalizedState.error)) {
      return (
        <NetworkError
          onRetry={onRetry || normalizedState.retry}
          variant={errorVariant}
          size={errorSize}
        />
      )
    }

    if (isNotFoundError(normalizedState.error)) {
      return (
        <NotFoundError
          onGoBack={onGoBack}
          variant={errorVariant}
          size={errorSize}
        />
      )
    }

    if (isAuthError(normalizedState.error)) {
      return (
        <UnauthorizedError
          onLogin={onLogin}
          variant={errorVariant}
          size={errorSize}
        />
      )
    }

    // Server or generic error
    return (
      <ErrorStateEnhanced
        type="error"
        message={formatErrorMessage(normalizedState.error)}
        variant={errorVariant}
        size={errorSize}
        details={showDetails ? normalizedState.error : undefined}
        onRetry={onRetry || ('retry' in state ? state.retry : undefined)}
        showReload={showReload}
      />
    )
  }

  // Empty state check
  const checkIsEmpty = customIsEmpty || ((data: T | undefined) => {
    if (data === null || data === undefined) return true
    if (Array.isArray(data)) return data.length === 0
    if (typeof data === 'object') return Object.keys(data).length === 0
    return false
  })

  if (normalizedState.isSuccess && checkIsEmpty(normalizedState.data)) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        action={emptyAction}
        variant={emptyVariant}
      />
    )
  }

  // Success state - render children
  if (normalizedState.data !== undefined) {
    return (
      <>
        {typeof children === 'function' ? children(normalizedState.data) : children}
      </>
    )
  }

  // Fallback loading state
  return (
    <LoadingState
      variant="spinner"
      container="none"
      message="Loading..."
      size="md"
    />
  )
})

/**
 * Specialized renderers for common patterns
 */

// List renderer with consistent loading/error/empty states
export const ListRenderer = memo(function ListRenderer<T extends unknown[]>({
  state,
  children,
  loading = {},
  error = {},
  empty = {},
  ...props
}: StateRendererProps<T>) {
  return (
    <StateRenderer
      state={state as QueryState<unknown> | MutationState<unknown>}
      loading={{
        variant: 'skeleton',
        layout: 'list',
        count: 5,
        ...loading
      }}
      error={{
        variant: 'card',
        ...error
      }}
      empty={{
        title: 'No items found',
        description: 'There are no items to display.',
        ...empty
      }}
      isEmpty={(data: unknown) => !data || (Array.isArray(data) && data.length === 0)}
      {...props}
    >
      {children as ReactNode | ((data: unknown) => ReactNode)}
    </StateRenderer>
  )
})

