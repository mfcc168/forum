/**
 * MongoDB Connection Pool Management
 * 
 * Implements efficient connection pooling and caching for improved performance
 */

import { MongoClient, Db } from 'mongodb'

interface ConnectionPool {
  client: MongoClient | null
  database: Db | null
  isConnecting: boolean
  lastConnected: number
  connectionAttempts: number
}

class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager
  private pool: ConnectionPool
  private readonly maxRetries = 3
  private readonly retryDelay = 1000
  private readonly connectionTimeout = 30000
  private readonly maxIdleTime = 300000 // 5 minutes

  private constructor() {
    this.pool = {
      client: null,
      database: null,
      isConnecting: false,
      lastConnected: 0,
      connectionAttempts: 0
    }
  }

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager()
    }
    return DatabaseConnectionManager.instance
  }

  async getDatabase(): Promise<Db> {
    // Return existing connection if valid
    if (this.pool.database && this.isConnectionValid()) {
      return this.pool.database
    }

    // Prevent concurrent connection attempts
    if (this.pool.isConnecting) {
      return this.waitForConnection()
    }

    return this.establishConnection()
  }

  private isConnectionValid(): boolean {
    if (!this.pool.client || !this.pool.database) {
      return false
    }

    const now = Date.now()
    const timeSinceLastConnection = now - this.pool.lastConnected

    // Check if connection has been idle too long
    if (timeSinceLastConnection > this.maxIdleTime) {
      this.closeConnection()
      return false
    }

    return true
  }

  private async waitForConnection(): Promise<Db> {
    return new Promise((resolve, reject) => {
      const checkConnection = () => {
        if (this.pool.database && !this.pool.isConnecting) {
          resolve(this.pool.database)
        } else if (!this.pool.isConnecting) {
          reject(new Error('Connection failed'))
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      checkConnection()
    })
  }

  private async establishConnection(): Promise<Db> {
    this.pool.isConnecting = true
    this.pool.connectionAttempts++

    try {
      const uri = process.env.MONGODB_URI
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set')
      }

      const dbName = process.env.MONGODB_DB || 'minecraft_server'

      // Create client with optimized options
      const client = new MongoClient(uri, {
        // Connection pool settings
        maxPoolSize: 10, // Maximum number of connections in pool
        minPoolSize: 2,  // Minimum number of connections to maintain
        maxIdleTimeMS: this.maxIdleTime,
        
        // Connection timeout settings
        serverSelectionTimeoutMS: this.connectionTimeout,
        socketTimeoutMS: 45000,
        connectTimeoutMS: this.connectionTimeout,
        
        // Monitoring settings
        heartbeatFrequencyMS: 10000,
        
        // Retry settings
        retryWrites: true,
        retryReads: true,
        
        // Performance optimizations
        compressors: ['zlib'],
        zlibCompressionLevel: 6,
      })

      await client.connect()
      
      const database = client.db(dbName)
      
      // Test the connection
      await database.admin().ping()

      this.pool.client = client
      this.pool.database = database
      this.pool.lastConnected = Date.now()
      this.pool.connectionAttempts = 0
      this.pool.isConnecting = false

      // Set up connection monitoring
      this.setupConnectionMonitoring()

      // MongoDB connected successfully
      return database

    } catch (error) {
      this.pool.isConnecting = false
      
      console.error(`❌ MongoDB connection attempt ${this.pool.connectionAttempts} failed:`, error)
      
      // Retry with exponential backoff
      if (this.pool.connectionAttempts < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, this.pool.connectionAttempts - 1)
        // Retrying connection
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.establishConnection()
      }
      
      throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error}`)
    }
  }

  private setupConnectionMonitoring() {
    if (!this.pool.client) return

    this.pool.client.on('connectionPoolCreated', () => {
      // MongoDB connection pool created
    })

    this.pool.client.on('connectionCreated', () => {
      // New MongoDB connection established
    })

    this.pool.client.on('connectionClosed', () => {
      // MongoDB connection closed
    })

    this.pool.client.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
      this.closeConnection()
    })
  }

  private closeConnection() {
    if (this.pool.client) {
      this.pool.client.close()
    }
    
    this.pool.client = null
    this.pool.database = null
    this.pool.lastConnected = 0
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.pool.client) {
      await this.pool.client.close()
      // MongoDB connection closed gracefully
    }
    
    this.pool.client = null
    this.pool.database = null
    this.pool.lastConnected = 0
  }

  // Get connection stats
  getStats() {
    return {
      isConnected: !!this.pool.database,
      lastConnected: this.pool.lastConnected,
      connectionAttempts: this.pool.connectionAttempts,
      isConnecting: this.pool.isConnecting,
      uptime: this.pool.lastConnected ? Date.now() - this.pool.lastConnected : 0
    }
  }
}

// Singleton instance
export const dbConnectionManager = DatabaseConnectionManager.getInstance()

// Convenience function for getting database connection
export async function getDatabase(): Promise<Db> {
  return dbConnectionManager.getDatabase()
}

// Query result cache
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private static instance: QueryCache
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes
  private cleanupInterval?: NodeJS.Timeout

  private constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache()
    }
    return QueryCache.instance
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(pattern: string): void {
    // Support wildcard invalidation
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.delete(pattern)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Singleton instance
export const queryCache = QueryCache.getInstance()

// Cached query helper
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = queryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute query and cache result
  const result = await queryFn()
  queryCache.set(key, result, ttl)
  
  return result
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  // Shutting down gracefully
  await dbConnectionManager.disconnect()
  queryCache.destroy()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  // Shutting down gracefully
  await dbConnectionManager.disconnect() 
  queryCache.destroy()
  process.exit(0)
})