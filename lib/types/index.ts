/**
 * Unified Type System - Clean Export Interface
 * 
 * Single source of truth with clear, consistent exports.
 * This replaces the complex 14-file system with a simple 2-file architecture.
 */

// ============================================================================
// ENTITIES (single source of truth for all data models)
// ============================================================================

// ============================================================================
// ENTITIES (organized modular structure)
// ============================================================================

// Re-export all entity types from the organized modular structure
export * from './entities'

// ============================================================================
// COMPONENT PROPS (single source of truth for all UI components)
// ============================================================================
export type {
  // Base patterns  
  BaseProps,
  InteractiveProps,
  DataProps,
  FormProps,

  // UI components
  ButtonProps,
  InputProps,
  TextareaProps,
  SelectProps,
  CardProps,
  ModalProps,
  IconProps,
  BadgeProps,
  AvatarProps,
  LoadingSpinnerProps,
  SkeletonProps,
  WysiwygEditorProps,
  LanguageContextType,

  // Layout components
  PageContainerProps,
  PageHeaderProps,
  SidebarProps,
  NavProps,

  // Content components (colocated with components - removed from centralized exports)

  // Filter and search components
  CategoryOption,
  CategoryFilterProps,
  SidebarCategoryFilterProps,
  SearchProps,
  FilterProps,

  // State components
  LoadingStateProps,
  ErrorStateProps,
  EmptyStateProps,

  // Page components (base patterns only - specific page props colocated)
  PageProps,
  DetailPageProps,
  ListPageProps,

  // Form components (removed - form patterns are component-specific)

  // Utility components
  ClientOnlyProps,
  HydrationCheckProps,
  ConfirmModalProps,
  ToastProps,

  // Admin components (removed - component-specific props should be colocated)
} from './components'