/**
 * Query State Management Types
 * 
 * React Query and state management patterns, hook options, and query interfaces
 */

// ============================================================================
// CONTENT QUERY OPTIONS (moved from hooks.ts for better organization)
// ============================================================================

/** Interface for all content query options */
export interface ContentQueryOptions {
  category?: string
  search?: string
  page?: number
  limit?: number
  enabled?: boolean
}

/** Sort options that all content types support */
export type SortOptions = 'latest' | 'popular' | 'views'

/** Status options for content */
export type StatusOptions = 'draft' | 'published' | 'archived'

/** Extended interface for blog posts */
export interface BlogPostQueryOptions extends ContentQueryOptions {
  sortBy?: SortOptions
  status?: StatusOptions
}

/** Extended interface for forum posts (has unique sort and status options) */
export interface ForumPostQueryOptions extends ContentQueryOptions {
  sortBy?: SortOptions | 'replies' | 'oldest'
  status?: StatusOptions | 'active' | 'locked' | 'all'
}

/** Extended interface for wiki guides (has unique properties) */
export interface WikiGuideQueryOptions extends ContentQueryOptions {
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  sortBy?: SortOptions
  status?: StatusOptions
  category?: 'getting-started' | 'gameplay' | 'features' | 'community'
}

/** Response structure for paginated content */
export interface ContentResponse<T> {
  success: boolean
  message?: string
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
    filters: {
      category?: string
      search?: string
      status: string
      [key: string]: string | undefined
    }
  }
}

/** Single item response */
export interface SingleItemResponse<T> {
  success: boolean
  message?: string
  data: {
    item: T
  }
}

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