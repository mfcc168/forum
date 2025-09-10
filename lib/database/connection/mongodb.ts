import { MongoClient } from 'mongodb'

// Only validate on server-side (not in browser)
if (typeof window === 'undefined' && !process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

// Server-side only variables
let client: MongoClient | undefined
let clientPromise: Promise<MongoClient> | undefined

// Only initialize MongoDB client on server-side
function initializeConnection(): Promise<MongoClient> {
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB connections are not allowed on the client-side')
  }

  if (clientPromise) {
    console.log('🔄 [MongoDB] Reusing existing connection promise')
    return clientPromise
  }

  const uri = process.env.MONGODB_URI || ''
  console.log('🔗 [MongoDB] Initializing new connection...')
  console.log('🔗 [MongoDB] URI exists:', !!uri)
  console.log('🔗 [MongoDB] URI prefix:', uri.substring(0, 20) + '...')
  
  const options = {
    // Serverless-optimized timeouts (increased for cold starts)
    serverSelectionTimeoutMS: 30000, // 30 seconds (was 10)
    connectTimeoutMS: 30000, // 30 seconds (was 10)
    socketTimeoutMS: 0, // No timeout for long operations (was 45000)
    
    // Serverless connection pool settings
    maxPoolSize: 1, // Single connection per function (was 10)
    minPoolSize: 0, // No persistent connections (was 1)
    maxIdleTimeMS: 30000, // Close idle connections quickly
    
    // Reliability settings for serverless
    retryWrites: true,
    retryReads: true,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ [MongoDB] Development mode - using global connection')
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      console.log('🆕 [MongoDB] Creating new MongoClient for development')
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect().then(client => {
        console.log('✅ [MongoDB] Successfully connected to database')
        return client
      }).catch(error => {
        console.error('❌ [MongoDB] Connection failed:', error)
        throw error
      })
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    console.log('🚀 [MongoDB] Production mode - creating new connection')
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options)
    clientPromise = client.connect().then(client => {
      console.log('✅ [MongoDB] Successfully connected to database (production)')
      return client
    }).catch(error => {
      console.error('❌ [MongoDB] Connection failed (production):', error)
      throw error
    })
  }

  return clientPromise
}

// Lazy initialization - only create connection when actually needed
const getClientPromise = (): Promise<MongoClient> => {
  if (typeof window !== 'undefined') {
    throw new Error('MongoDB connections are not allowed on the client-side')
  }
  return initializeConnection()
}

export default getClientPromise

export async function connectToDatabase() {
  // Only allow database connections on server-side
  if (typeof window !== 'undefined') {
    throw new Error('Database connections are not allowed on the client-side')
  }
  
  const client = await getClientPromise()
  const db = client.db(process.env.MONGODB_DB || 'minecraft_server')
  return { client, db }
}