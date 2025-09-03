// =============================================
// DATABASE - Clean, organized main exports
// =============================================

// Models (Schema definitions)
export * from './models'

// Indexes (Database performance indexes)
export * from './indexes'

// Connection (MongoDB connection)
export * from './connection'
export { default as clientPromise, connectToDatabase } from './connection/mongodb'

// Main database class for easy usage
import { Db } from 'mongodb'
import { clientPromise } from './connection'

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
      const client = await clientPromise
      this.db = client.db(process.env.MONGODB_DB || 'minecraft_server')
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