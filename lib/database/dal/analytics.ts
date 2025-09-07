/**
 * Analytics Data Access Layer
 * 
 * Handles web analytics metrics, server metrics, activity logs, and notifications
 */

import { ObjectId, Filter } from 'mongodb'
import { BaseDAL } from './base'
import type { 
  ServerMetrics, 
  ActivityLog, 
  Notification,
  SearchIndex 
} from '@/lib/database/models/analytics'

// Web analytics metric interface (for performance metrics from API)
export interface WebAnalyticsMetric {
  _id?: ObjectId
  type: 'web-vital' | 'route-performance' | 'error' | 'bundle' | 'api-call' | 'cache'
  data: Record<string, unknown>
  timestamp: number
  userAgent?: string | null
  ip?: string
  createdAt: Date
}

export class AnalyticsDAL extends BaseDAL<WebAnalyticsMetric> {
  constructor() {
    super('analytics')
  }

  /**
   * Create a new web analytics metric
   */
  async createMetric(metricData: {
    type: WebAnalyticsMetric['type']
    data: Record<string, unknown>
    timestamp: number
    userAgent?: string | null
    ip?: string
  }): Promise<WebAnalyticsMetric> {
    const metric: Omit<WebAnalyticsMetric, '_id'> = {
      ...metricData,
      createdAt: new Date(metricData.timestamp)
    }

    const result = await this.insertOne(metric)
    return {
      _id: result.insertedId,
      ...metric
    }
  }

  /**
   * Get analytics metrics with filtering
   */
  async getMetrics(options: {
    type?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    skip?: number
  } = {}): Promise<{
    metrics: WebAnalyticsMetric[]
    total: number
  }> {
    const { type, startDate, endDate, limit = 100, skip = 0 } = options

    // Build filter
    const filter: Filter<WebAnalyticsMetric> = {}
    
    if (type) {
      filter.type = type as WebAnalyticsMetric['type']
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      }
    } else if (startDate) {
      filter.createdAt = { $gte: startDate }
    } else if (endDate) {
      filter.createdAt = { $lte: endDate }
    }

    // Get metrics with sorting and pagination
    const metrics = await this.find(filter, {
      sort: { createdAt: -1 },
      limit,
      skip
    })

    // Get total count for pagination
    const total = await this.count(filter)

    return { metrics, total }
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(days: number = 7): Promise<{
    totalMetrics: number
    byType: Record<string, number>
    recentErrors: WebAnalyticsMetric[]
    performanceAverages: Record<string, number>
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgData: { $push: '$data' }
        }
      }
    ]

    const results = await this.aggregate<{ _id: string; count: number; avgData: unknown[] }>(pipeline)
    
    // Process results
    const byType: Record<string, number> = {}
    let totalMetrics = 0
    
    results.forEach((result) => {
      byType[result._id] = result.count
      totalMetrics += result.count
    })

    // Get recent errors
    const recentErrors = await this.find(
      { 
        type: 'error',
        createdAt: { $gte: startDate }
      },
      {
        sort: { createdAt: -1 },
        limit: 10
      }
    )

    // Calculate performance averages (simplified)
    const performanceMetrics = await this.find(
      {
        type: { $in: ['web-vital', 'route-performance'] },
        createdAt: { $gte: startDate }
      }
    )

    const performanceAverages: Record<string, number> = {}
    // This would need more sophisticated calculation based on the actual data structure
    
    return {
      totalMetrics,
      byType,
      recentErrors,
      performanceAverages
    }
  }

  /**
   * Clean old analytics data
   */
  async cleanOldMetrics(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await this.deleteOne({
      createdAt: { $lt: cutoffDate }
    } as Filter<WebAnalyticsMetric>)

    return result.deletedCount || 0
  }
}

// Server Metrics DAL
export class ServerMetricsDAL extends BaseDAL<ServerMetrics> {
  constructor() {
    super('serverMetrics')
  }

  /**
   * Record server metrics snapshot
   */
  async recordServerMetrics(metrics: Omit<ServerMetrics, '_id' | 'createdAt' | 'updatedAt'>): Promise<ServerMetrics> {
    const serverMetrics: Omit<ServerMetrics, '_id'> = {
      ...metrics,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await this.insertOne(serverMetrics)
    return {
      _id: result.insertedId,
      ...serverMetrics
    }
  }

  /**
   * Get latest server metrics
   */
  async getLatestMetrics(serverId?: string): Promise<ServerMetrics | null> {
    const filter: Filter<ServerMetrics> = {}
    if (serverId) {
      filter.serverId = serverId
    }

    const metrics = await this.find(filter, {
      sort: { createdAt: -1 },
      limit: 1
    })

    return metrics[0] || null
  }
}

// Activity Log DAL
export class ActivityLogDAL extends BaseDAL<ActivityLog> {
  constructor() {
    super('activityLogs')
  }

  /**
   * Log user activity
   */
  async logActivity(activity: Omit<ActivityLog, '_id' | 'createdAt' | 'updatedAt'>): Promise<ActivityLog> {
    const activityLog: Omit<ActivityLog, '_id'> = {
      ...activity,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await this.insertOne(activityLog)
    return {
      _id: result.insertedId,
      ...activityLog
    }
  }

  /**
   * Get activity logs with filtering
   */
  async getActivityLogs(options: {
    actorId?: ObjectId | string
    actionType?: string
    resourceType?: string
    riskLevel?: 'low' | 'medium' | 'high'
    startDate?: Date
    endDate?: Date
    limit?: number
    skip?: number
  } = {}): Promise<{
    logs: ActivityLog[]
    total: number
  }> {
    const { 
      actorId, 
      actionType, 
      resourceType, 
      riskLevel, 
      startDate, 
      endDate, 
      limit = 50, 
      skip = 0 
    } = options

    // Build filter
    const filter: Filter<ActivityLog> = {}
    
    if (actorId) {
      filter['actor.id'] = typeof actorId === 'string' ? new ObjectId(actorId) : actorId
    }
    
    if (actionType) {
      filter['action.type'] = actionType
    }
    
    if (resourceType) {
      filter['action.resource'] = resourceType
    }
    
    if (riskLevel) {
      filter.riskLevel = riskLevel
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      }
    }

    const logs = await this.find(filter, {
      sort: { createdAt: -1 },
      limit,
      skip
    })

    const total = await this.count(filter)

    return { logs, total }
  }
}

// Notification DAL
export class NotificationDAL extends BaseDAL<Notification> {
  constructor() {
    super('notifications')
  }

  /**
   * Create notification
   */
  async createNotification(notification: Omit<Notification, '_id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const notificationDoc: Omit<Notification, '_id'> = {
      ...notification,
      status: 'unread',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await this.insertOne(notificationDoc)
    return {
      _id: result.insertedId,
      ...notificationDoc
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: ObjectId | string, options: {
    status?: 'unread' | 'read' | 'archived'
    type?: Notification['type']
    limit?: number
    skip?: number
  } = {}): Promise<{
    notifications: Notification[]
    total: number
    unreadCount: number
  }> {
    const { status, type, limit = 20, skip = 0 } = options
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId

    // Build filter
    const filter: Filter<Notification> = {
      userId: userObjectId
    }
    
    if (status) {
      filter.status = status
    }
    
    if (type) {
      filter.type = type
    }

    const notifications = await this.find(filter, {
      sort: { createdAt: -1 },
      limit,
      skip
    })

    const total = await this.count(filter)
    const unreadCount = await this.count({
      userId: userObjectId,
      status: 'unread'
    })

    return { notifications, total, unreadCount }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId: ObjectId | string, notificationIds: (ObjectId | string)[]): Promise<number> {
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId
    const objectIds = notificationIds.map(id => typeof id === 'string' ? new ObjectId(id) : id)

    const result = await this.updateOne(
      {
        userId: userObjectId,
        _id: { $in: objectIds },
        status: 'unread'
      } as Filter<Notification>,
      {
        $set: {
          status: 'read',
          readAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount || 0
  }
}

// Search Index DAL
export class SearchIndexDAL extends BaseDAL<SearchIndex> {
  constructor() {
    super('searchIndex')
  }

  /**
   * Update search index for content
   */
  async updateSearchIndex(indexData: Omit<SearchIndex, '_id' | 'createdAt' | 'updatedAt' | 'lastIndexedAt'>): Promise<SearchIndex> {
    const { resourceType, resourceId } = indexData

    // Check if index already exists
    const existing = await this.findOne({
      resourceType,
      resourceId
    } as Filter<SearchIndex>)

    const searchIndexDoc: Omit<SearchIndex, '_id'> = {
      ...indexData,
      lastIndexedAt: new Date(),
      isIndexed: true,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (existing) {
      await this.updateById(existing._id!, {
        $set: searchIndexDoc
      })
      return {
        _id: existing._id!,
        ...searchIndexDoc
      }
    } else {
      const result = await this.insertOne(searchIndexDoc)
      return {
        _id: result.insertedId,
        ...searchIndexDoc
      }
    }
  }

  /**
   * Search content
   */
  async searchContent(query: string, options: {
    resourceTypes?: ('post' | 'reply' | 'comment' | 'blog' | 'user')[]
    language?: 'en' | 'zh-TW'
    limit?: number
    skip?: number
  } = {}): Promise<{
    results: SearchIndex[]
    total: number
  }> {
    const { resourceTypes, language, limit = 20, skip = 0 } = options

    // Build text search filter
    const filter: Filter<SearchIndex> = {
      $text: { $search: query },
      isIndexed: true
    }

    if (resourceTypes && resourceTypes.length > 0) {
      filter.resourceType = { $in: resourceTypes }
    }

    if (language) {
      filter.language = language
    }

    const results = await this.find(filter, {
      sort: { searchScore: -1, createdAt: -1 },
      limit,
      skip
    })

    const total = await this.count(filter)

    return { results, total }
  }
}