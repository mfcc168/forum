import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
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
  bufferMaxEntries: 0, // Fail fast instead of buffering
}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function connectToDatabase() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || 'minecraft_server')
  return { client, db }
}