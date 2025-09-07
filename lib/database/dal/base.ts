/**
 * Base Database Access Layer
 * 
 * Provides common database operations and connection management
 * for all DAL implementations.
 */

import { Db, Collection, ObjectId, Filter, UpdateFilter, InsertOneResult, UpdateResult, DeleteResult, Document } from 'mongodb'
import { getDatabase } from '@/lib/database'

export abstract class BaseDAL<T extends { _id?: string | ObjectId } | { id?: string }> {
  protected db!: Db
  protected collectionName: string

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  /**
   * Initialize database connection
   */
  protected async init(): Promise<void> {
    if (!this.db) {
      const database = await getDatabase()
      this.db = database.getDb()
    }
  }

  /**
   * Get collection with proper typing
   */
  protected async getCollection(): Promise<Collection<T>> {
    await this.init()
    return this.db.collection<T>(this.collectionName)
  }

  /**
   * Find documents with filters
   */
  async find(filter: Filter<T> = {}, options: {
    sort?: Record<string, 1 | -1>
    limit?: number
    skip?: number
  } = {}): Promise<T[]> {
    const collection = await this.getCollection()
    let query = collection.find(filter)
    
    if (options.sort) query = query.sort(options.sort)
    if (options.skip) query = query.skip(options.skip)
    if (options.limit) query = query.limit(options.limit)
    
    const results = await query.toArray()
    return results as T[]
  }

  /**
   * Find single document
   */
  async findOne(filter: Filter<T>): Promise<T | null> {
    const collection = await this.getCollection()
    const result = await collection.findOne(filter)
    return result as T | null
  }

  /**
   * Find by ID
   */
  async findById(id: string | ObjectId): Promise<T | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return this.findOne({ _id: objectId } as Filter<T>)
  }

  /**
   * Count documents
   */
  async count(filter: Filter<T> = {}): Promise<number> {
    const collection = await this.getCollection()
    return collection.countDocuments(filter)
  }

  /**
   * Insert document
   */
  async insertOne(doc: Omit<T, '_id'>): Promise<InsertOneResult<T>> {
    const collection = await this.getCollection()
    return collection.insertOne(doc as never)
  }

  /**
   * Update document
   */
  async updateOne(filter: Filter<T>, update: UpdateFilter<T>): Promise<UpdateResult<T>> {
    const collection = await this.getCollection()
    return collection.updateOne(filter, update)
  }

  /**
   * Update by ID
   */
  async updateById(id: string | ObjectId, update: UpdateFilter<T>): Promise<UpdateResult<T>> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return this.updateOne({ _id: objectId } as Filter<T>, update)
  }

  /**
   * Delete document
   */
  async deleteOne(filter: Filter<T>): Promise<DeleteResult> {
    const collection = await this.getCollection()
    return collection.deleteOne(filter)
  }

  /**
   * Delete by ID
   */
  async deleteById(id: string | ObjectId): Promise<DeleteResult> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return this.deleteOne({ _id: objectId } as Filter<T>)
  }

  /**
   * Soft delete (mark as deleted)
   */
  async softDelete(filter: Filter<T>): Promise<UpdateResult<T>> {
    return this.updateOne(filter, { 
      $set: { 
        isDeleted: true, 
        deletedAt: new Date() 
      } 
    } as unknown as UpdateFilter<T>)
  }

  /**
   * Aggregation pipeline
   */
  async aggregate<R extends Document = T>(pipeline: object[]): Promise<R[]> {
    const collection = await this.getCollection()
    const results = await collection.aggregate<R>(pipeline).toArray()
    return results
  }

  /**
   * Check if document exists
   */
  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter)
    return count > 0
  }
}