/**
 * Real-time stats subscription hook using WebSockets
 * Provides live stats updates across multiple users
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { ContentStats, ContentInteractionState } from '@/lib/types'

// WebSocket message types (matching server-side types)
interface StatsUpdateMessage {
  type: 'stats_update'
  contentType: 'forum' | 'blog' | 'wiki'
  contentId: string
  slug: string
  stats: ContentStats
  interactions?: ContentInteractionState
  timestamp: number
  userId?: string
}

interface WSMessage {
  type: 'stats_update' | 'ping' | 'pong' | 'subscribe' | 'unsubscribe'
  [key: string]: unknown
}

interface UseRealtimeStatsOptions {
  enabled?: boolean
  autoReconnect?: boolean
  reconnectInterval?: number
  debug?: boolean
}

export function useRealtimeStats(options: UseRealtimeStatsOptions = {}) {
  const {
    enabled = true,
    autoReconnect = true,
    reconnectInterval = 5000,
    debug = false
  } = options

  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<Set<string>>(new Set())
  
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  // WebSocket URL (you can make this configurable)
  const wsUrl = `ws://localhost:3001${session?.user?.id ? `?userId=${session.user.id}` : ''}`

  const log = useCallback((message: string, data?: unknown) => {
    if (debug) {
      console.log(`[RealtimeStats] ${message}`, data)
    }
  }, [debug])

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      log('Connecting to WebSocket server...')
      setConnectionState('connecting')
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        log('WebSocket connected')
        setConnectionState('connected')
        
        // Re-subscribe to previously subscribed content
        subscriptionsRef.current.forEach(contentId => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            contentId,
            userId: session?.user?.id
          }))
        })
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          log('Received message:', message)

          if (message.type === 'stats_update') {
            handleStatsUpdate(message as StatsUpdateMessage)
          } else if (message.type === 'ping') {
            // Respond to server ping
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        log('WebSocket closed:', { code: event.code, reason: event.reason })
        setConnectionState('disconnected')
        
        // Auto-reconnect if enabled and not a clean close
        if (autoReconnect && event.code !== 1000) {
          scheduleReconnect()
        }
      }

      ws.onerror = (error) => {
        log('WebSocket error:', error)
        setConnectionState('error')
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionState('error')
      if (autoReconnect) {
        scheduleReconnect()
      }
    }
  }, [enabled, wsUrl, session?.user?.id, autoReconnect, log])

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      log('Attempting to reconnect...')
      connect()
    }, reconnectInterval)
  }, [connect, reconnectInterval, log])

  // Handle incoming stats updates
  const handleStatsUpdate = useCallback((message: StatsUpdateMessage) => {
    log('Processing stats update:', message)
    setLastUpdate(Date.now())

    // Update React Query cache for the specific item
    queryClient.setQueryData(
      [`${message.contentType}-content`, message.slug],
      (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData
        
        const data = oldData as Record<string, unknown>
        return {
          ...data,
          stats: message.stats,
          // Only update interactions if they're provided (for the action user)
          ...(message.interactions && { interactions: message.interactions })
        }
      }
    )

    // Update any list caches that might contain this item
    queryClient.setQueriesData(
      { queryKey: [`${message.contentType}-content`] },
      (oldQuery: unknown) => {
        if (!oldQuery || typeof oldQuery !== 'object') return oldQuery

        const old = oldQuery as Record<string, unknown>
        if (!old.data || !Array.isArray(old.data)) return oldQuery

        const updatedItems = old.data.map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 
              'slug' in item && item.slug === message.slug) {
            return {
              ...item,
              stats: message.stats,
              ...(message.interactions && { interactions: message.interactions })
            }
          }
          return item
        })

        return {
          ...old,
          data: updatedItems
        }
      }
    )

    log('Cache updated successfully')
  }, [queryClient, log])

  // Subscribe to content updates
  const subscribe = useCallback((contentType: 'forum' | 'blog' | 'wiki', contentId: string) => {
    const fullContentId = `${contentType}:${contentId}`
    
    if (subscriptionsRef.current.has(fullContentId)) {
      return // Already subscribed
    }

    subscriptionsRef.current.add(fullContentId)
    log(`Subscribing to ${fullContentId}`)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        contentType,
        contentId,
        userId: session?.user?.id
      }))
    }
  }, [session?.user?.id, log])

  // Unsubscribe from content updates
  const unsubscribe = useCallback((contentType: 'forum' | 'blog' | 'wiki', contentId: string) => {
    const fullContentId = `${contentType}:${contentId}`
    
    if (!subscriptionsRef.current.has(fullContentId)) {
      return // Not subscribed
    }

    subscriptionsRef.current.delete(fullContentId)
    log(`Unsubscribing from ${fullContentId}`)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        contentType,
        contentId,
        userId: session?.user?.id
      }))
    }
  }, [session?.user?.id, log])

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
    }
  }, [enabled, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Connection state
    isConnected: connectionState === 'connected',
    connectionState,
    lastUpdate,
    
    // Subscription methods
    subscribe,
    unsubscribe,
    
    // Manual connection control
    connect,
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Manual disconnect')
      }
    },
    
    // Debugging info
    subscriptions: Array.from(subscriptionsRef.current)
  }
}

/**
 * Hook for subscribing to real-time stats for specific content
 * Automatically subscribes/unsubscribes based on component lifecycle
 */
export function useContentRealtimeStats(
  contentType: 'forum' | 'blog' | 'wiki',
  contentId: string,
  options?: UseRealtimeStatsOptions
) {
  const realtimeStats = useRealtimeStats(options)

  useEffect(() => {
    if (contentId && realtimeStats.isConnected) {
      realtimeStats.subscribe(contentType, contentId)
      
      return () => {
        realtimeStats.unsubscribe(contentType, contentId)
      }
    }
  }, [contentType, contentId, realtimeStats])

  return realtimeStats
}