/**
 * Statistics and Analytics Types
 * 
 * Comprehensive stats interfaces for different content types and system metrics
 */
import type { ForumCategory } from './categories'
import type { Entity } from './base'

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

/** Base stats response pattern */
export interface StatsResponse {
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalUsers: number
  activeUsers: number
  categoriesCount: number
}

/** Forum-specific stats */
export interface ForumStatsResponse extends StatsResponse {
  totalTopics: number
  totalReplies: number
  totalMembers: number
  onlineMembers: number
  categories: ForumCategory[]
  popularPosts?: Array<{
    title: string
    slug: string
    viewsCount: number
    repliesCount: number
  }>
}

/** Blog stats */
export interface BlogStats extends StatsResponse {
  totalDrafts: number
  recentPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    publishedAt: string
  }>
  mostPopular: import('./content').BlogPost[]
}

/** Blog stats response */
export type BlogStatsResponse = ApiResponse<BlogStats>

/** Wiki stats response */  
export type WikiStatsResponse = ApiResponse<WikiStats>

/** Wiki stats */
export interface WikiStats extends StatsResponse {
  totalGuides: number
  guidesCountByCategory: Record<string, number>
  guidesCountByDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number>
  averageHelpfulRating: number
  mostHelpfulGuides: Array<{
    title: string
    slug: string
    helpfulsCount: number
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }>
  recentGuides: Array<{
    title: string
    slug: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    createdAt: string
  }>
}

/** Individual post stats */
export interface PostStats {
  viewsCount: number
  likesCount: number
  bookmarksCount: number
  sharesCount: number
  repliesCount: number
}

/** Server information */
export interface ServerInfo extends Entity {
  name: string
  version: string
  playerCount: number
  maxPlayers: number
  currentPlayers: number
  status: 'online' | 'offline' | 'maintenance'
  lastUpdate: string
  description?: string
  features: string[]
  rules: string[]
}

/** Search result */
export interface SearchResult<TContent, TCategory> {
  content: TContent[]
  categories: TCategory[]
  total: number
  query: string
  suggestions?: string[]
}

// Import ApiResponse for the response types that need it
type ApiResponse<T> = import('./api').ApiResponse<T>