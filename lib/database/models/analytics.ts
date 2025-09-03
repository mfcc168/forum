import { ObjectId } from 'mongodb'
import { BaseDocument } from './base'

// =============================================
// ANALYTICS MODEL - Server Metrics, Activity Logs, Notifications
// =============================================

// Server Metrics
export interface ServerMetrics extends Omit<BaseDocument, 'version'> {
  // Server identification  
  serverId: string
  serverName: string
  minecraftVersion: string
  
  // Player statistics
  players: {
    online: number
    max: number
    peak24h: number
    unique24h: number
    unique7d: number
    unique30d: number
    
    // Player list (for online players only)
    list?: {
      uuid: string
      username: string
      displayName?: string
      world: string
      joinedAt: Date
      playtime: number
    }[]
  }
  
  // Server performance
  performance: {
    tps: number
    mspt: number // Milliseconds per tick
    memoryUsed: number
    memoryMax: number
    cpuUsage: number
    diskUsage: {
      used: number
      total: number
    }
    
    // World statistics
    worlds: {
      name: string
      players: number
      entities: number
      chunks: number
      size: number // in MB
    }[]
  }
  
  // Server status
  status: 'online' | 'offline' | 'maintenance' | 'starting'
  plugins: {
    name: string
    version: string
    enabled: boolean
  }[]
  
  // Uptime tracking
  uptime: number // in seconds
  uptimePercentage24h: number
  uptimePercentage7d: number
  uptimePercentage30d: number
  
  // Indexes: createdAt, serverId + createdAt, status
}

// Activity Logs
export interface ActivityLog extends BaseDocument {
  // Actor (who performed the action)
  actor: {
    type: 'user' | 'system' | 'api'
    id?: ObjectId
    username?: string
    ipAddress?: string
    userAgent?: string
  }
  
  // Action details
  action: {
    type: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'moderate'
    resource: 'post' | 'reply' | 'comment' | 'user' | 'category' | 'blog' | 'settings'
    resourceId?: ObjectId
    description: string
  }
  
  // Target (what was acted upon)
  target?: {
    type: 'user' | 'post' | 'reply' | 'comment' | 'category' | 'blog'
    id: ObjectId
    name?: string
  }
  
  // Context and metadata
  context: {
    source: 'web' | 'api' | 'mobile' | 'admin'
    session?: string
    requestId?: string
    
    // Changes made (for update actions)
    changes?: {
      field: string
      oldValue?: unknown
      newValue?: unknown
    }[]
    
    // Additional metadata
    metadata?: Record<string, unknown>
  }
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high'
  
  // Indexes: actor.id + createdAt, action.resource + action.type, createdAt, riskLevel
}

// Notifications
export interface Notification extends BaseDocument {
  // Recipients
  userId: ObjectId
  
  // Notification content
  type: 'mention' | 'reply' | 'like' | 'follow' | 'system' | 'moderation' | 'announcement'
  title: string
  message: string
  
  // Action details
  actionUrl?: string
  actionText?: string
  
  // Sender information
  sender?: {
    userId: ObjectId
    username: string
    avatar?: string
  }
  
  // Related resources
  relatedResource?: {
    type: 'post' | 'reply' | 'comment' | 'user'
    id: ObjectId
    title?: string
  }
  
  // Status
  status: 'unread' | 'read' | 'archived'
  readAt?: Date
  
  // Delivery
  channels: {
    web: boolean
    email: boolean
    push: boolean
  }
  deliveredAt?: {
    web?: Date
    email?: Date
    push?: Date
  }
  
  // Priority and grouping
  priority: 'low' | 'normal' | 'high' | 'urgent'
  groupKey?: string // For grouping similar notifications
  
  // Indexes: userId + status + createdAt, userId + type, groupKey
}

// Search Index
export interface SearchIndex extends BaseDocument {
  // Content identification
  resourceType: 'post' | 'reply' | 'comment' | 'blog' | 'user'
  resourceId: ObjectId
  
  // Searchable content
  title?: string
  content: string
  plainText: string
  keywords: string[]
  tags: string[]
  
  // Search weights and scoring
  titleWeight: number
  contentWeight: number
  authorWeight: number
  
  // Metadata for search results
  metadata: {
    authorId: ObjectId
    authorName: string
    categoryId?: ObjectId
    categoryName?: string
    createdAt: Date
    stats?: {
      views: number
      likes: number
      replies: number
    }
  }
  
  // Search optimization
  language: 'en' | 'zh-TW'
  searchScore: number // Pre-calculated relevance score
  
  // Status
  isIndexed: boolean
  lastIndexedAt: Date
  
  // Full-text search index on: content, title, keywords, tags
}