/**
 * Database Access Layer (DAL) - Main Export
 * 
 * Centralized access to all database operations.
 * Replaces direct MongoDB queries throughout the application.
 */

import { BaseDAL } from './base'
import { ForumDAL } from './forum'
import { BlogDAL } from './blog'
import { UserDAL } from './user'
import { WikiDAL } from './wiki'
import { DexDAL } from './dex'
import { 
  AnalyticsDAL, 
  ServerMetricsDAL, 
  ActivityLogDAL, 
  NotificationDAL, 
  SearchIndexDAL 
} from './analytics'
import type { ServerInfo } from '@/lib/types'

export { 
  BaseDAL, 
  ForumDAL, 
  BlogDAL, 
  UserDAL, 
  WikiDAL,
  DexDAL,
  AnalyticsDAL,
  ServerMetricsDAL,
  ActivityLogDAL,
  NotificationDAL,
  SearchIndexDAL
}

export type {
  UserWithActivity
} from './user'

// Re-export main types for convenience
export type {
  User,
  BlogPost,
  BlogCategory,
  BlogStats,
  ForumPost,
  ForumCategory,
  ForumStatsResponse,
  WikiGuide,
  WikiCategory,
  WikiStats,
  PostFilters,
  WikiFilters,
  UserFilters,
  PostStats,
  UserStats,
  PaginatedResponse
} from '@/lib/types'

export type {
  BlogPostFilters
} from '@/lib/database/query-builder'

/**
 * DAL Factory - Singleton pattern for database access
 * 
 * Usage:
 * ```typescript
 * import { DAL } from '@/lib/database/dal'
 * 
 * const posts = await DAL.forum.getPosts(filters, pagination)
 * const blogPosts = await DAL.blog.getPosts(filters)
 * const user = await DAL.user.findById(userId)
 * ```
 */
export class DAL {
  private static _forum: ForumDAL
  private static _blog: BlogDAL
  private static _user: UserDAL
  private static _wiki: WikiDAL
  private static _dex: DexDAL
  private static _analytics: AnalyticsDAL

  /**
   * Forum operations
   */
  static get forum(): ForumDAL {
    if (!this._forum) {
      this._forum = new ForumDAL()
    }
    return this._forum
  }

  /**
   * Blog operations
   */
  static get blog(): BlogDAL {
    if (!this._blog) {
      this._blog = new BlogDAL()
    }
    return this._blog
  }

  /**
   * User operations
   */
  static get user(): UserDAL {
    if (!this._user) {
      this._user = new UserDAL()
    }
    return this._user
  }

  /**
   * Wiki operations
   */
  static get wiki(): WikiDAL {
    if (!this._wiki) {
      this._wiki = new WikiDAL()
    }
    return this._wiki
  }

  /**
   * Dex operations
   */
  static get dex(): DexDAL {
    if (!this._dex) {
      this._dex = new DexDAL()
    }
    return this._dex
  }

  /**
   * Analytics operations
   */
  static get analytics(): AnalyticsDAL {
    if (!this._analytics) {
      this._analytics = new AnalyticsDAL()
    }
    return this._analytics
  }

  /**
   * Server operations
   */
  static async getServerInfo(): Promise<ServerInfo | null> {
    const serverInfoDAL = new (class extends BaseDAL<ServerInfo> {
      constructor() { super('serverInfo') }
    })()
    const serverInfo = await serverInfoDAL.findOne({})
    return serverInfo
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache(): void {
    this._forum = undefined as unknown as ForumDAL
    this._blog = undefined as unknown as BlogDAL
    this._user = undefined as unknown as UserDAL
    this._wiki = undefined as unknown as WikiDAL
    this._analytics = undefined as unknown as AnalyticsDAL
  }
}


