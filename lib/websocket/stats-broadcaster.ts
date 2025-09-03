/**
 * WebSocket Stats Broadcasting System
 * Handles real-time stats updates across all connected clients
 */

import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import type { ContentStats, ContentInteractionState } from '@/lib/types'

// Message types for WebSocket communication
export interface StatsUpdateMessage {
  type: 'stats_update'
  contentType: 'forum' | 'blog' | 'wiki'
  contentId: string
  slug: string
  stats: ContentStats
  interactions?: ContentInteractionState // Only sent to the user who made the action
  timestamp: number
  userId?: string // For targeted updates
}

export interface SubscriptionMessage {
  type: 'subscribe' | 'unsubscribe'
  contentType: 'forum' | 'blog' | 'wiki'
  contentId: string
  userId?: string
}

export interface HeartbeatMessage {
  type: 'ping' | 'pong'
  timestamp: number
}

export type WSMessage = StatsUpdateMessage | SubscriptionMessage | HeartbeatMessage

// Connection metadata
interface ConnectionInfo {
  userId?: string
  subscriptions: Set<string> // Set of contentId strings
  lastSeen: number
}

export class StatsBroadcaster {
  private wss: WebSocketServer | null = null
  private connections = new Map<WebSocket, ConnectionInfo>()
  private contentSubscribers = new Map<string, Set<WebSocket>>() // contentId -> Set<WebSocket>
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(private port: number = 3001) {}

  /**
   * Initialize WebSocket server
   */
  public initialize(): void {
    if (this.wss) {
      console.log('WebSocket server already initialized')
      return
    }

    this.wss = new WebSocketServer({ 
      port: this.port,
      perMessageDeflate: {
        // Enable message compression for better performance
        threshold: 1024,
        concurrencyLimit: 10,
      }
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    this.startHeartbeat()

    console.log(`📡 Stats WebSocket server running on port ${this.port}`)
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Initialize connection info
    this.connections.set(ws, {
      userId: this.extractUserIdFromRequest(request),
      subscriptions: new Set(),
      lastSeen: Date.now()
    })

    console.log(`🔗 New WebSocket connection (${this.connections.size} total)`)

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString())
        this.handleMessage(ws, message)
      } catch (error) {
        console.error('Invalid WebSocket message:', error)
      }
    })

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(ws)
    })

    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.handleDisconnection(ws)
    })

    // Send initial connection acknowledgment
    this.sendMessage(ws, {
      type: 'pong',
      timestamp: Date.now()
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, message: WSMessage): void {
    const connectionInfo = this.connections.get(ws)
    if (!connectionInfo) return

    connectionInfo.lastSeen = Date.now()

    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(ws, message.contentId, true)
        break

      case 'unsubscribe':
        this.handleSubscription(ws, message.contentId, false)
        break

      case 'ping':
        this.sendMessage(ws, {
          type: 'pong',
          timestamp: Date.now()
        })
        break

      default:
        console.warn('Unknown message type:', message)
    }
  }

  /**
   * Handle subscription/unsubscription to content updates
   */
  private handleSubscription(ws: WebSocket, contentId: string, subscribe: boolean): void {
    const connectionInfo = this.connections.get(ws)
    if (!connectionInfo) return

    if (subscribe) {
      // Add to user's subscriptions
      connectionInfo.subscriptions.add(contentId)

      // Add to global content subscribers
      if (!this.contentSubscribers.has(contentId)) {
        this.contentSubscribers.set(contentId, new Set())
      }
      this.contentSubscribers.get(contentId)!.add(ws)

      console.log(`📺 User subscribed to ${contentId}`)
    } else {
      // Remove from user's subscriptions
      connectionInfo.subscriptions.delete(contentId)

      // Remove from global content subscribers
      const subscribers = this.contentSubscribers.get(contentId)
      if (subscribers) {
        subscribers.delete(ws)
        if (subscribers.size === 0) {
          this.contentSubscribers.delete(contentId)
        }
      }

      console.log(`📺 User unsubscribed from ${contentId}`)
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(ws: WebSocket): void {
    const connectionInfo = this.connections.get(ws)
    if (!connectionInfo) return

    // Remove from all content subscriptions
    connectionInfo.subscriptions.forEach(contentId => {
      const subscribers = this.contentSubscribers.get(contentId)
      if (subscribers) {
        subscribers.delete(ws)
        if (subscribers.size === 0) {
          this.contentSubscribers.delete(contentId)
        }
      }
    })

    // Remove connection
    this.connections.delete(ws)
    console.log(`🔌 WebSocket disconnected (${this.connections.size} remaining)`)
  }

  /**
   * Broadcast stats update to all subscribers of specific content
   */
  public broadcastStatsUpdate(update: Omit<StatsUpdateMessage, 'type' | 'timestamp'>): void {
    const message: StatsUpdateMessage = {
      ...update,
      type: 'stats_update',
      timestamp: Date.now()
    }

    const subscribers = this.contentSubscribers.get(update.contentId)
    if (!subscribers || subscribers.size === 0) {
      return // No active subscribers
    }

    let successCount = 0
    let failCount = 0

    subscribers.forEach(ws => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          // For the user who made the action, include their interaction state
          const connectionInfo = this.connections.get(ws)
          const isActionUser = connectionInfo?.userId === update.userId
          
          const personalizedMessage = isActionUser && update.interactions 
            ? { ...message, interactions: update.interactions }
            : { ...message, interactions: undefined }

          this.sendMessage(ws, personalizedMessage)
          successCount++
        } else {
          // Clean up closed connections
          this.handleDisconnection(ws)
          failCount++
        }
      } catch (error) {
        console.error('Failed to send stats update:', error)
        this.handleDisconnection(ws)
        failCount++
      }
    })

    console.log(`📊 Stats update broadcast: ${successCount} sent, ${failCount} failed`)
  }

  /**
   * Send message to specific WebSocket connection
   */
  private sendMessage(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  /**
   * Start heartbeat to keep connections alive and clean up stale ones
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const staleThreshold = 5 * 60 * 1000 // 5 minutes

      this.connections.forEach((info, ws) => {
        if (now - info.lastSeen > staleThreshold) {
          console.log('🧹 Cleaning up stale WebSocket connection')
          ws.terminate()
          this.handleDisconnection(ws)
        } else if (ws.readyState === WebSocket.OPEN) {
          // Send ping to keep connection alive
          this.sendMessage(ws, {
            type: 'ping',
            timestamp: now
          })
        }
      })
    }, 30000) // Check every 30 seconds
  }

  /**
   * Extract user ID from request (you can customize this based on your auth)
   */
  private extractUserIdFromRequest(request: IncomingMessage): string | undefined {
    // Extract from query params, headers, or JWT token
    const url = new URL(request.url || '', 'http://localhost')
    return url.searchParams.get('userId') || undefined
  }

  /**
   * Get connection stats
   */
  public getStats() {
    return {
      connections: this.connections.size,
      subscriptions: this.contentSubscribers.size,
      totalSubscriptions: Array.from(this.contentSubscribers.values())
        .reduce((sum, subscribers) => sum + subscribers.size, 0)
    }
  }

  /**
   * Shutdown WebSocket server gracefully
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    if (this.wss) {
      this.wss.close(() => {
        console.log('📡 WebSocket server shut down')
      })
    }

    // Close all connections
    this.connections.forEach((_, ws) => {
      ws.close()
    })

    this.connections.clear()
    this.contentSubscribers.clear()
  }
}

// Singleton instance
export const statsBroadcaster = new StatsBroadcaster()