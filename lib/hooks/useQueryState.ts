'use client'

import { useCallback, useMemo } from 'react'
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import type { QueryStateOptions, QueryState, MutationState } from '@/lib/types'

/**
 * Enhanced query state hook that provides consistent loading, error, and success states
 */
export function useQueryState<T = unknown>(
  queryResult: UseQueryResult<T>,
  _options: QueryStateOptions = {} // Reserved for future configuration
): QueryState<T> {
  const {
    data,
    isLoading,
    isRefetching,
    error,
    isSuccess,
    refetch
  } = queryResult

  // Modern React Query: isLoading is for initial loads, use isPending && isFetching for general loading
  const isInitialLoading = isLoading

  // Enhanced state calculations
  const hasError = !!error
  const isReady = isSuccess && !!data && !hasError
  const isEmpty = isSuccess && !data && !hasError

  // Retry function
  const retry = useCallback(() => {
    refetch()
  }, [refetch])

  // Reset error function (refetch will clear error)
  const resetError = useCallback(() => {
    if (hasError) {
      refetch()
    }
  }, [hasError, refetch])

  return useMemo(() => ({
    data,
    isLoading,
    isInitialLoading,
    isRefetching,
    error,
    isError: hasError,
    hasError,
    isSuccess,
    isReady,
    isEmpty,
    retry,
    refetch,
    resetError
  }), [
    data,
    isLoading,
    isInitialLoading,
    isRefetching,
    error,
    hasError,
    isSuccess,
    isReady,
    isEmpty,
    retry,
    refetch,
    resetError
  ])
}

/**
 * Enhanced mutation state hook
 */
export function useMutationState<TData = unknown, TVariables = unknown>(
  mutationResult: UseMutationResult<TData, Error, TVariables> | undefined,
  _options: QueryStateOptions = {} // Reserved for future configuration
): MutationState<TData, TVariables> | null {

  return useMemo(() => {
    if (!mutationResult) {
      return null
    }
    
    const mutate = mutationResult.mutate
    const mutateAsync = mutationResult.mutateAsync  
    const data = mutationResult.data
    const isLoading = mutationResult.isPending || false
    const error = mutationResult.error || null
    const isSuccess = mutationResult.isSuccess || false
    const reset = mutationResult.reset || (() => {})
    const hasError = !!error
    
    return {
    mutate: mutate ? (variables: TVariables) => mutate(variables) : () => {},
    mutateAsync: mutateAsync ?? (async () => { throw new Error('Mutation not available') }),
    data,
    isLoading,
    error,
    isError: hasError,
    hasError,
    isSuccess,
    reset
    }
  }, [mutationResult])
}

/**
 * Composite hook for handling both query and mutation states
 */
export function useCompositeState<
  TQueryData = unknown,
  TMutationData = unknown,
  TMutationVariables = unknown
>(
  queryResult: UseQueryResult<TQueryData>,
  mutationResult?: UseMutationResult<TMutationData, Error, TMutationVariables>,
  options: QueryStateOptions = {}
) {
  const queryState = useQueryState(queryResult, options)
  const mutationState = useMutationState(mutationResult, options)

  // Combined loading state
  const isLoading = queryState.isLoading || (mutationState?.isLoading ?? false)
  
  // Combined error state
  const error = queryState.error || mutationState?.error || null
  const hasError = queryState.hasError || (mutationState?.hasError ?? false)

  // Combined ready state
  const isReady = queryState.isReady && !(mutationState?.isLoading ?? false)

  return useMemo(() => ({
    query: queryState,
    mutation: mutationState,
    // Combined states
    isLoading,
    error,
    hasError,
    isReady,
    // Convenience methods
    retry: queryState.retry,
    refetch: queryState.refetch,
    reset: () => {
      queryState.resetError()
      mutationState?.reset()
    }
  }), [queryState, mutationState, isLoading, error, hasError, isReady])
}

/**
 * Hook for handling paginated queries
 */
export function usePaginatedState<T = unknown>(
  queryResult: UseQueryResult<T>,
  pagination?: {
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
) {
  const queryState = useQueryState(queryResult)

  return useMemo(() => ({
    ...queryState,
    pagination: pagination || {
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  }), [queryState, pagination])
}

/**
 * Hook for handling infinite query states
 */
export function useInfiniteState<T = unknown>(
  queryResult: UseQueryResult<T> & {
    hasNextPage?: boolean
    hasPreviousPage?: boolean
    isFetchingNextPage?: boolean
    isFetchingPreviousPage?: boolean
    fetchNextPage?: () => void
    fetchPreviousPage?: () => void
  }
) {
  const queryState = useQueryState(queryResult)

  const isLoadingMore = queryResult.isFetchingNextPage || queryResult.isFetchingPreviousPage || false
  const hasNextPage = queryResult.hasNextPage || false
  const hasPreviousPage = queryResult.hasPreviousPage || false

  const loadMore = useCallback(() => {
    if (hasNextPage && queryResult.fetchNextPage) {
      queryResult.fetchNextPage()
    }
  }, [hasNextPage, queryResult])

  const loadPrevious = useCallback(() => {
    if (hasPreviousPage && queryResult.fetchPreviousPage) {
      queryResult.fetchPreviousPage()
    }
  }, [hasPreviousPage, queryResult])

  return useMemo(() => ({
    ...queryState,
    // Infinite query specific states
    isLoadingMore,
    hasNextPage,
    hasPreviousPage,
    loadMore,
    loadPrevious
  }), [queryState, isLoadingMore, hasNextPage, hasPreviousPage, loadMore, loadPrevious])
}

/**
 * Type guards for better error handling
 */
export const isNetworkError = (error: Error | unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  return 'name' in error && error.name === 'NetworkError'
}

export const isValidationError = (error: Error | unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  return 'name' in error && error.name === 'ValidationError'
}

export const isAuthError = (error: Error | unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  return 'name' in error && (error.name === 'AuthError' || error.name === 'UnauthorizedError')
}

export const isNotFoundError = (error: Error | unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  return 'name' in error && error.name === 'NotFoundError'
}

/**
 * Error message formatting
 */
export const formatErrorMessage = (error: Error | unknown): string => {
  if (!error) return 'An unknown error occurred'
  
  if (typeof error === 'string') return error
  
  if (error instanceof Error) {
    // Check for specific error types
    if (isNetworkError(error)) {
      return 'Network connection failed. Please check your internet connection.'
    }
    
    if (isAuthError(error)) {
      return 'Authentication required. Please sign in to continue.'
    }
    
    if (isNotFoundError(error)) {
      return 'The requested resource was not found.'
    }
    
    if (isValidationError(error)) {
      return error.message || 'Please check your input and try again.'
    }
    
    return error.message || 'An unexpected error occurred'
  }
  
  return 'An unexpected error occurred'
}