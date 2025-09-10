// =============================================
// DATABASE - Clean, organized main exports
// =============================================

// Models (Schema definitions)
export * from './models'

// Indexes (Database performance indexes)
export * from './indexes'

// Connection (MongoDB connection)
export * from './connection'
export { default as getClientPromise, connectToDatabase } from './connection/mongodb'

// Main database class for easy usage
import { Db } from 'mongodb'
import getClientPromise from './connection/mongodb'

export class Database {
  private static instance: Database
  private db?: Db

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  async connect(): Promise<Database> {
    if (!this.db) {
      console.log('🔗 [Database] Connecting to database...')
      const client = await getClientPromise()
      const dbName = process.env.MONGODB_DB || 'minecraft_server'
      console.log('🔗 [Database] Using database:', dbName)
      this.db = client.db(dbName)
      console.log('✅ [Database] Database connection established')
    }
    return this
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }
}

// Convenience function for quick database access
export async function getDatabase(): Promise<Database> {
  return await Database.getInstance().connect()
}