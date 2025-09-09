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
// DEX ENTITIES
// ============================================================================
export type {
  DexMonster,
  MonsterStats,
  MonsterDrop,
  SpawningInfo,
  DexCategory,
  DexStats,
  DexFilters,
  MonsterInteractionState
} from './dex'

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
  BlogFilters,
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
  InteractionResponse,
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
  PartialContentItem,
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

// ============================================================================
// TRANSLATIONS
// ============================================================================
export type {
  TranslationStructure,
  TranslationKey,
  TranslationFunction,
  TranslationContext
} from './translations'