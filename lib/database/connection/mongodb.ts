import { MongoClient } from 'mongodb'

console.log('MongoDB connection module loading...')
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI)
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0)

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is missing!')
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

console.log('MongoDB URI is set, proceeding with connection setup')

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
    console.log('Development: Creating new MongoDB client')
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  } else {
    console.log('Development: Reusing existing MongoDB client')
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Production: Creating new MongoDB client')
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function connectToDatabase() {
  console.log('connectToDatabase: Attempting to connect...')
  try {
    const client = await clientPromise
    console.log('connectToDatabase: Client connected successfully')
    const dbName = process.env.MONGODB_DB || 'minecraft_server'
    console.log('connectToDatabase: Using database:', dbName)
    const db = client.db(dbName)
    console.log('connectToDatabase: Database connection established')
    return { client, db }
  } catch (error) {
    console.error('connectToDatabase: Connection failed:', error)
    throw error
  }
}