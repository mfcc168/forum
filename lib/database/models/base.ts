import { ObjectId } from 'mongodb'

// =============================================
// BASE DOCUMENT INTERFACES
// =============================================

// Core timestamp interface for all documents
export interface BaseDocument {
  _id?: ObjectId
  createdAt: Date
  updatedAt: Date
  version: number // For optimistic concurrency control
}

// Soft delete interface
export interface SoftDeleteDocument extends BaseDocument {
  isDeleted: boolean
  deletedAt?: Date
  deletedBy?: ObjectId
}