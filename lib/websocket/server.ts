/**
 * WebSocket server initialization for Next.js
 * This should be imported early in your application lifecycle
 */

import { statsBroadcaster } from './stats-broadcaster'

let isInitialized = false
let shutdownHandler: (() => void) | null = null

// Increase max listeners to handle development hot reloads
process.setMaxListeners(20)

export function initializeWebSocketServer(): void {
  if (isInitialized) {
    console.log('WebSocket server already initialized')
    return
  }
  
  // Debug: Check current listener counts
  if (process.env.NODE_ENV === 'development') {
    const sigTermListeners = process.listenerCount('SIGTERM')
    const sigIntListeners = process.listenerCount('SIGINT')
    
    if (sigTermListeners > 5 || sigIntListeners > 5) {
      console.warn(`⚠️  High listener count detected: SIGTERM(${sigTermListeners}) SIGINT(${sigIntListeners})`)
    }
  }

  try {
    // Remove any existing listeners to prevent memory leaks
    if (shutdownHandler) {
      process.removeListener('SIGTERM', shutdownHandler)
      process.removeListener('SIGINT', shutdownHandler)
      process.removeListener('SIGUSR2', shutdownHandler)
    }

    // Initialize the WebSocket server
    statsBroadcaster.initialize()
    isInitialized = true
    
    // Create shutdown handler
    shutdownHandler = () => {
      console.log('Shutting down WebSocket server...')
      statsBroadcaster.shutdown()
      
      // Clean up listeners
      if (shutdownHandler) {
        process.removeListener('SIGTERM', shutdownHandler)
        process.removeListener('SIGINT', shutdownHandler)
        process.removeListener('SIGUSR2', shutdownHandler)
        shutdownHandler = null
      }
      
      isInitialized = false
      process.exit(0)
    }

    // Add listeners
    process.on('SIGTERM', shutdownHandler)
    process.on('SIGINT', shutdownHandler)
    process.on('SIGUSR2', shutdownHandler) // For nodemon restarts

  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error)
    isInitialized = false
  }
}

/**
 * Clean up WebSocket server and remove event listeners
 */
export function cleanupWebSocketServer(): void {
  if (shutdownHandler) {
    process.removeListener('SIGTERM', shutdownHandler)
    process.removeListener('SIGINT', shutdownHandler)
    process.removeListener('SIGUSR2', shutdownHandler)
    shutdownHandler = null
  }
  
  statsBroadcaster.shutdown()
  isInitialized = false
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  // Handle Next.js hot module replacement
  if (typeof module !== 'undefined' && module && 'hot' in module) {
    const hotModule = module as { hot?: { dispose: (callback: () => void) => void } }
    if (hotModule.hot) {
      // Clean up on hot reload
      hotModule.hot.dispose(() => {
        cleanupWebSocketServer()
      })
    }
  }
  
  initializeWebSocketServer()
}