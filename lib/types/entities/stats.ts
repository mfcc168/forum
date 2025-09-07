/**
 * Statistics and Analytics Types
 * 
 * Comprehensive stats interfaces for different content types and system metrics
 */
import type { Entity } from './base'
import type { ApiResponse } from './api'

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
export interface ForumStats extends StatsResponse {
  totalTopics: number
  totalReplies: number
  totalMembers: number
  onlineMembers: number
  categories: Array<{
    name: string
    slug: string
    postsCount: number
    order: number
  }>
  popularPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    repliesCount: number
  }>
  recentPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    repliesCount: number
    createdAt: string
  }>
}

/** Blog stats */
export interface BlogStats extends StatsResponse {
  totalDrafts: number
  categories: Array<{
    name: string
    slug: string
    postsCount: number
    order: number
  }>
  popularPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    likesCount: number
  }>
  recentPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    publishedAt: string
  }>
}

/** Forum stats response */
export type ForumStatsResponse = ApiResponse<ForumStats>

/** Blog stats response */
export type BlogStatsResponse = ApiResponse<BlogStats>

/** Wiki stats response */  
export type WikiStatsResponse = ApiResponse<WikiStats>

/** Wiki stats */
export interface WikiStats extends StatsResponse {
  totalGuides: number
  totalDrafts: number
  averageHelpfulRating: number
  guidesCountByDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number>
  categories: Array<{
    name: string
    slug: string
    postsCount: number
    order: number
  }>
  popularPosts: Array<{
    title: string
    slug: string
    viewsCount: number
    helpfulsCount: number
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  }>
  recentPosts: Array<{
    title: string
    slug: string
    viewsCount: number
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

