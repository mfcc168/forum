/**
 * Unified Entities Export
 * 
 * Re-exports all entity types from their organized sub-modules
 * This provides a clean import interface while maintaining modular organization
 */

// ============================================================================
// BASE PATTERNS
// ============================================================================
export type {
  Entity,
  UserRef,
  ContentStats,
  ContentInteractionState
} from './base'

// ============================================================================
// CONTENT ENTITIES
// ============================================================================
export type {
  ForumPost,
  BlogPost,
  WikiGuide,
  ForumReply
} from './content'

// ============================================================================
// CATEGORIES
// ============================================================================
export type {
  ForumCategory,
  BlogCategory,
  WikiCategory
} from './categories'

// ============================================================================
// USER SYSTEM
// ============================================================================
export type {
  User,
  UserProfile,
  UserStats,
  UserPreferences,
  AuthProviders,
  AuthUser,
  ServerUser,
  UserInteraction
} from './users'

// ============================================================================
// API PATTERNS
// ============================================================================
export type {
  ApiResponse,
  PaginationMeta,
  ContentFilters,
  PostFilters,
  WikiFilters,
  UserFilters,
  BlogPostsResponse,
  ForumPostsResponse,
  WikiGuidesResponse,
  BlogPostResponse,
  ForumPostResponse,
  WikiGuideResponse,
  PaginatedResponse,
  PaginatedResult,
  ContentResponse,
  BaseInteractionResponse,
  DetailedInteractionResponse
} from './api'

// ============================================================================
// STATS & ANALYTICS
// ============================================================================
export type {
  StatsResponse,
  ForumStatsResponse,
  BlogStats,
  BlogStatsResponse,
  WikiStatsResponse,
  WikiStats,
  PostStats,
  ServerInfo,
  SearchResult
} from './stats'

// ============================================================================
// UI INTERACTIONS
// ============================================================================
export type {
  ConfirmOptions,
  ConfirmState
} from './ui'

// ============================================================================
// QUERY STATE MANAGEMENT
// ============================================================================
export type {
  QueryStateOptions,
  QueryState,
  MutationState
} from './queries'

// ============================================================================
// UTILITIES & ENUMS
// ============================================================================
export type {
  ContentStatus,
  ContentModule,
  UserRole,
  UserStatus,
  InteractionType,
  DifficultyLevel,
  SortOption,
  LanguageCode,
  // Utility types for common patterns
  RequireFields,
  OptionalFields,
  WithTimestamps,
  WithEntityFields,
  UpdateData,
  ExtractResponseData,
  FilterOptions,
  ContentItem,
  PermissionUser,
  // Error handling
  AppError,
  ValidationErrorDetail,
  DatabaseErrorInterface,
  ValidationErrorInterface,
  ApiError,
  // MongoDB integration
  ObjectId,
  IndexDefinition,
  IndexStats
} from './utils'