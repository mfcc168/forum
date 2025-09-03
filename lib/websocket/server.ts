/**
 * WebSocket server initialization for Next.js
 * This should be imported early in your application lifecycle
 */

import { statsBroadcaster } from './stats-broadcaster'

let isInitialized = false

export function initializeWebSocketServer(): void {
  if (isInitialized) {
    console.log('WebSocket server already initialized')
    return
  }

  try {
    // Initialize the WebSocket server
    statsBroadcaster.initialize()
    isInitialized = true
    
    // Graceful shutdown handling
    const shutdown = () => {
      console.log('Shutting down WebSocket server...')
      statsBroadcaster.shutdown()
      process.exit(0)
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
    process.on('SIGUSR2', shutdown) // For nodemon restarts

  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error)
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeWebSocketServer()
}