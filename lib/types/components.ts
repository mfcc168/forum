/**
 * Reusable Component Props
 * 
 * Only contains truly reusable UI component props that are used across multiple components.
 * Component-specific props should be colocated with their respective components.
 */

import type { ReactNode, MouseEvent, ChangeEvent } from 'react'

// ============================================================================
// BASE PATTERNS (truly reusable across all components)
// ============================================================================

/** Base props for all components */
export interface BaseProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

/** Interactive component props */
export interface InteractiveProps extends BaseProps {
  disabled?: boolean
  loading?: boolean
  onClick?: (event?: MouseEvent) => void
}

/** Data display component props */
export interface DataProps<T> extends BaseProps {
  data: T[]
  loading?: boolean
  error?: string
  onLoadMore?: () => void
  hasMore?: boolean
}

// ============================================================================
// FUNDAMENTAL UI COMPONENTS (used across the app)
// ============================================================================

/** Button component */
export interface ButtonProps extends InteractiveProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'minecraft' | 'default'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  iconAfter?: string
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  href?: string
  external?: boolean
  'aria-label'?: string
}

/** Input component */
export interface InputProps extends BaseProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'search'
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  error?: string
  helperText?: string
  label?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void
  onFocus?: (event: ChangeEvent<HTMLInputElement>) => void
}

/** Textarea component */
export interface TextareaProps extends BaseProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  rows?: number
  error?: string
  helperText?: string
  label?: string
  maxLength?: number
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

/** Select component */
export interface SelectProps extends BaseProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
  label?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  onChange?: (value: string) => void
}

/** Card component */
export interface CardProps extends BaseProps {
  variant?: 'default' | 'bordered' | 'elevated' | 'outlined' | 'minecraft' | 'panel'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  clickable?: boolean
  onClick?: (event: MouseEvent) => void
  header?: ReactNode
  footer?: ReactNode
  padding?: boolean
  isSelected?: boolean
  hoverable?: boolean
  id?: string
}

/** Modal component */
export interface ModalProps extends BaseProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  footer?: ReactNode
}

/** Icon component */
export interface IconProps extends BaseProps {
  name: string
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

/** Badge component */
export interface BadgeProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'default' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
}

/** Avatar component */
export interface AvatarProps extends BaseProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'circle' | 'square' | 'rounded'
  fallback?: ReactNode
}

/** Loading spinner */
export interface LoadingSpinnerProps extends BaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse'
  color?: 'primary' | 'secondary' | 'white'
  message?: string
}

/** Skeleton component props */
export interface SkeletonProps extends BaseProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
}

/** WYSIWYG Editor component props */
export interface WysiwygEditorProps extends BaseProps {
  value?: string
  content?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  toolbar?: 'basic' | 'full' | 'minimal'
  height?: number
}

// ============================================================================
// LAYOUT COMPONENTS (truly reusable layouts)
// ============================================================================

/** Page container */
export interface PageContainerProps extends BaseProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
  center?: boolean
}

/** Page header */
export interface PageHeaderProps extends BaseProps {
  title: string
  subtitle?: string
  description?: string
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  actions?: ReactNode
}

// ============================================================================
// STATE COMPONENTS (reusable across all content)
// ============================================================================

/** Loading state */
export interface LoadingStateProps extends BaseProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
  message?: string
  size?: 'sm' | 'md' | 'lg'
  layout?: 'inline' | 'block' | 'overlay'
}

/** Error state */
export interface ErrorStateProps extends BaseProps {
  error: string
  onRetry?: () => void
  showReload?: boolean
  variant?: 'inline' | 'card' | 'page'
  title?: string
}

/** Empty state */
export interface EmptyStateProps extends BaseProps {
  title: string
  description?: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
    variant?: ButtonProps['variant']
  }
  variant?: 'default' | 'card' | 'page'
}

// ============================================================================
// UTILITY COMPONENTS (truly reusable utilities)
// ============================================================================

/** Client-only wrapper */
export interface ClientOnlyProps extends BaseProps {
  fallback?: ReactNode
}

/** Hydration check */
export interface HydrationCheckProps extends BaseProps {
  fallback?: ReactNode
}

/** Confirm modal */
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' | 'warning'
  loading?: boolean
}

/** Toast notification */
export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/** Form component props (base pattern) */
export interface FormProps<T> extends BaseProps {
  initialData?: Partial<T>
  onSubmit: (data: T) => void | Promise<void>
  loading?: boolean
  validationSchema?: unknown
}

/** 
 * Translation object structure (safe alternative to 'any')
 * Uses Record<string, any> but with better documentation and typing intention
 * This provides the flexibility needed for the complex translation structure
 * while being explicit about the type choice
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslationObject = import('@/lib/translations/locales/en').TranslationObject

/** Language context type with proper locale typing */
export interface LanguageContextType {
  locale: 'zh-TW' | 'en'
  t: TranslationObject
  setLocale: (locale: 'zh-TW' | 'en') => void
  changeLanguage: (locale: 'zh-TW' | 'en') => void
  translations?: Record<string, TranslationObject>
}

/** Sidebar */
export interface SidebarProps extends BaseProps {
  isOpen?: boolean
  onClose?: () => void
  position?: 'left' | 'right'
  width?: 'sm' | 'md' | 'lg'
  overlay?: boolean
}

/** Navigation */
export interface NavProps extends BaseProps {
  items: Array<{
    label: string
    href: string
    icon?: string
    active?: boolean
    children?: Array<{
      label: string
      href: string
      icon?: string
    }>
  }>
  variant?: 'horizontal' | 'vertical'
  showIcons?: boolean
}

// ============================================================================
// CATEGORY/FILTER COMPONENTS (reusable patterns)
// ============================================================================

/** Category option (reusable across all modules) */
export interface CategoryOption {
  id: string
  name: string
  displayName: string
  count?: number
  icon?: string
  color?: string
}

/** Category filter */
export interface CategoryFilterProps extends BaseProps {
  categories: CategoryOption[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  title?: string
  showCounts?: boolean
  variant?: 'default' | 'compact'
  allCategoryLabel?: string
}

/** Search component */
export interface SearchProps extends BaseProps {
  query: string
  onChange: (query: string) => void
  onSubmit?: (query: string) => void
  placeholder?: string
  loading?: boolean
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  variant?: 'default' | 'compact' | 'hero'
}

/** Sidebar category filter */
export interface SidebarCategoryFilterProps extends BaseProps {
  categories: CategoryOption[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  title?: string
  showCounts?: boolean
  allPostsLabel?: string
  allPostsCount?: number
  iconName?: string
}

/** Filter component */
export interface FilterProps<T = Record<string, unknown>> extends BaseProps {
  filters: T
  onChange: (filters: T) => void
  onReset?: () => void
  showClearButton?: boolean
  variant?: 'horizontal' | 'vertical' | 'dropdown'
}

// ============================================================================
// NEXT.JS PAGE PROPS (reusable page patterns)
// ============================================================================

/** Base page props */
export interface PageProps {
  params?: Record<string, string>
  searchParams?: Record<string, string | string[] | undefined>
}

/** Content detail page props */
export interface DetailPageProps extends PageProps {
  params: { slug: string }
}

/** Content list page props */
export interface ListPageProps extends PageProps {
  searchParams?: {
    category?: string
    search?: string
    page?: string
    sort?: string
  }
}