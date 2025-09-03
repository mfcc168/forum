// Main Library Barrel Export
export * from '@/lib/types'
export * from '@/lib/contexts'
// Export utils except ValidationError to avoid conflict with types
export { 
  handleDatabaseError,
  DatabaseError,
  formatApiError 
} from '@/lib/utils/error-handler'

// Database exports (only operations, not duplicate types)
export { 
  clientPromise, 
  connectToDatabase, 
  Database, 
  getDatabase,
  createAllIndexes,
  validateIndexes
} from '@/lib/database'