/**
 * Query State Management Types
 * 
 * React Query and state management patterns
 */

// ============================================================================
// QUERY STATE MANAGEMENT
// ============================================================================

/** Query state options */
export interface QueryStateOptions {
  /** Loading state customization */
  loading?: {
    /** Minimum loading time to prevent flashing */
    minDuration?: number
    /** Show loading after delay */
    delay?: number
    /** Custom loading message */
    message?: string
  }
  /** Error state customization */
  error?: {
    /** Show error boundary */
    boundary?: boolean
    /** Custom error message */
    message?: string
    /** Retry configuration */
    retry?: {
      enabled: boolean
      maxAttempts: number
    }
  }
  /** Empty state customization */
  empty?: {
    /** Custom empty message */
    message?: string
    /** Custom empty icon */
    icon?: string
  }
}

/** Generic query state */
export interface QueryState<T = unknown> {
  /** Data from the query */
  data: T | undefined
  /** Loading state */
  isLoading: boolean
  /** Initial loading state */
  isInitialLoading: boolean
  /** Refetching state */
  isRefetching: boolean
  /** Error state */
  error: Error | null
  /** Success state */
  isSuccess: boolean
  /** Error state */
  isError: boolean
  /** Has error flag (convenience) */
  hasError: boolean
  /** Data is ready and available */
  isReady: boolean
  /** Data is empty */
  isEmpty: boolean
  /** Refetch function */
  refetch: () => void
  /** Retry function (alias for refetch) */
  retry: () => void
  /** Reset error function */
  resetError: () => void
}

/** Generic mutation state */
export interface MutationState<TData = unknown, TVariables = unknown> {
  /** Mutation function */
  mutate: (variables: TVariables) => void
  /** Async mutation function */
  mutateAsync: (variables: TVariables) => Promise<TData>
  /** Mutation data */
  data: TData | undefined
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Success state */
  isSuccess: boolean
  /** Error state */
  isError: boolean
  /** Has error flag (convenience) */
  hasError: boolean
  /** Reset mutation state */
  reset: () => void
}