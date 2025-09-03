// Shared components for reuse across blog, forum, and wiki

// Phase 1: Core Components
export { ContentForm } from './ContentForm'
export { AuthorDisplay } from './AuthorDisplay'
export { TagList } from './TagList'

// Phase 2: Layout Components
export { default as ContentCard } from './ContentCard'
export { default as StatsDisplay } from './StatsDisplay'
export { default as CategoryBadge } from './CategoryBadge'

// Phase 3: Utility Components
export { default as ActionButton } from './ActionButton'
export { default as ContentRenderer } from './ContentRenderer'
export { EmptyState } from '@/app/components/ui/EmptyState'
export { LoadingSpinner, Skeleton } from '@/app/components/ui/LoadingSpinner'

// Phase 4: Unified Components
export { ContentActions } from './ContentActions'
export { ContentDetail } from './ContentDetail'

// Re-export types
export type { 
  ContentFormConfig, 
  ContentFormField 
} from './ContentForm'

export type { AuthorDisplayProps } from './AuthorDisplay'
export type { TagListProps } from './TagList'
export type { ContentCardProps } from './ContentCard'
export type { StatsDisplayProps } from './StatsDisplay'
export type { CategoryBadgeProps } from './CategoryBadge'
export type { ActionButtonProps } from './ActionButton'
export type { ContentRendererProps } from './ContentRenderer'
export type { EmptyStateProps } from '@/app/components/ui/EmptyState'
export type { LoadingSpinnerProps, SkeletonProps } from '@/lib/types'
export type { ContentActionsConfig } from './ContentActions'
export type { ContentDetailConfig } from './ContentDetail'