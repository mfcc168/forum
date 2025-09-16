/**
 * Database testing utilities
 * Helpers for setting up test data and cleaning up after tests
 */

import { MongoClient, Db, ObjectId } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Connect to test database
 */
export async function connectTestDB(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const dbName = process.env.MONGODB_DB || 'minecraft_server_test'

  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  
  return db
}

/**
 * Disconnect from test database
 */
export async function disconnectTestDB(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}

/**
 * Clear all collections in test database
 */
export async function clearTestDB(): Promise<void> {
  const database = await connectTestDB()
  const collections = await database.collections()
  
  await Promise.all(
    collections.map(collection => collection.deleteMany({}))
  )
}

/**
 * Seed test data into database
 */
export async function seedTestData(): Promise<void> {
  const database = await connectTestDB()

  // Seed users
  await database.collection('users').insertMany([
    {
      _id: new ObjectId(),
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'member',
      avatar: 'https://example.com/avatar.jpg',
      profile: {
        bio: 'Test user bio',
        minecraft: {
          username: 'TestPlayer',
          uuid: 'test-uuid-123'
        }
      },
      stats: {
        postsCount: 0,
        repliesCount: 0,
        likesReceived: 0,
        reputation: 100,
        level: 1
      },
      preferences: {
        language: 'zh-TW',
        theme: 'light',
        notifications: {
          email: true,
          discord: false
        }
      },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'admin-user-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      avatar: 'https://example.com/admin-avatar.jpg',
      profile: {
        bio: 'Administrator',
        minecraft: {
          username: 'AdminPlayer',
          uuid: 'admin-uuid-123'
        }
      },
      stats: {
        postsCount: 5,
        repliesCount: 10,
        likesReceived: 50,
        reputation: 1000,
        level: 10
      },
      preferences: {
        language: 'zh-TW',
        theme: 'dark',
        notifications: {
          email: true,
          discord: true
        }
      },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ])

  // Seed wiki guides
  await database.collection('wikiGuides').insertMany([
    {
      _id: 'guide-1',
      title: 'How to Join Server',
      slug: 'how-to-join-server',
      content: '<h2>Joining the Server</h2><p>Follow these steps to join our Minecraft server...</p>',
      excerpt: 'Learn how to connect to our Minecraft server',
      category: 'getting-started',
      difficulty: 'beginner',
      tags: ['tutorial', 'beginner', 'server'],
      author: {
        id: 'admin-user-id',
        name: 'Admin User',
        avatar: 'https://example.com/admin-avatar.jpg'
      },
      stats: {
        viewsCount: 150,
        likesCount: 25,
        bookmarksCount: 10,
        sharesCount: 5,
        helpfulsCount: 30
      },
      status: 'published',
      estimatedReadTime: '5 minutes',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'guide-2',
      title: 'Economy System Guide',
      slug: 'economy-system-guide',
      content: '<h2>Server Economy</h2><p>Learn how to make money and trade on our server...</p>',
      excerpt: 'Complete guide to our server economy system',
      category: 'gameplay',
      difficulty: 'intermediate',
      tags: ['economy', 'money', 'trading'],
      author: {
        id: 'admin-user-id',
        name: 'Admin User',
        avatar: 'https://example.com/admin-avatar.jpg'
      },
      stats: {
        viewsCount: 200,
        likesCount: 45,
        bookmarksCount: 20,
        sharesCount: 8,
        helpfulsCount: 50
      },
      status: 'published',
      estimatedReadTime: '10 minutes',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    }
  ])

  // Seed blog posts
  await database.collection('blogPosts').insertMany([
    {
      _id: 'blog-1',
      title: 'Server Update 1.21.8',
      slug: 'server-update-1-21-8',
      content: '<h2>New Features</h2><p>We have exciting new features in this update...</p>',
      excerpt: 'Latest server update with new features and improvements',
      category: 'update',
      tags: ['update', 'features', 'improvements'],
      author: {
        id: 'admin-user-id',
        name: 'Admin User',
        avatar: 'https://example.com/admin-avatar.jpg'
      },
      stats: {
        viewsCount: 500,
        likesCount: 80,
        bookmarksCount: 25,
        sharesCount: 15
      },
      status: 'published',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    }
  ])

  // Seed forum posts
  await database.collection('forumPosts').insertMany([
    {
      _id: 'forum-1',
      title: 'Looking for Building Partners',
      slug: 'looking-for-building-partners',
      content: '<p>I am planning a massive castle build and looking for partners to help...</p>',
      category: 'general-discussion',
      categoryName: 'General Discussion',
      tags: ['building', 'collaboration', 'castle'],
      author: {
        id: 'test-user-id',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      },
      stats: {
        viewsCount: 75,
        repliesCount: 12,
        likesCount: 8
      },
      isPinned: false,
      isLocked: false,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      _id: 'forum-2',
      title: 'Important: Server Rules Updated',
      slug: 'important-server-rules-updated',
      content: '<p>Please read the updated server rules carefully...</p>',
      category: 'server-updates-news',
      categoryName: 'Server Updates & News',
      tags: ['rules', 'important', 'announcement'],
      author: {
        id: 'admin-user-id',
        name: 'Admin User',
        avatar: 'https://example.com/admin-avatar.jpg'
      },
      stats: {
        viewsCount: 300,
        repliesCount: 25,
        likesCount: 45
      },
      isPinned: true,
      isLocked: false,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    }
  ])

  // Seed forum replies
  await database.collection('forumReplies').insertMany([
    {
      _id: 'reply-1',
      postId: 'forum-1',
      postSlug: 'looking-for-building-partners',
      content: '<p>I would love to help with your castle build! I have experience with medieval architecture.</p>',
      author: {
        id: 'admin-user-id',
        name: 'Admin User',
        avatar: 'https://example.com/admin-avatar.jpg'
      },
      stats: {
        likesCount: 5
      },
      createdAt: new Date('2024-01-11'),
      updatedAt: new Date('2024-01-11')
    }
  ])

  // Seed user interactions
  await database.collection('userInteractions').insertMany([
    {
      _id: 'interaction-1',
      userId: 'test-user-id',
      targetId: 'guide-1',
      targetType: 'wiki',
      action: 'view',
      metadata: {
        userAgent: 'Test Browser',
        ipAddress: '127.0.0.1'
      },
      timestamp: new Date('2024-01-01T10:00:00Z')
    },
    {
      _id: 'interaction-2',
      userId: 'test-user-id',
      targetId: 'guide-1',
      targetType: 'wiki',
      action: 'like',
      metadata: {},
      timestamp: new Date('2024-01-01T10:05:00Z')
    }
  ])

  // Seed categories
  await database.collection('categories').insertMany([
    {
      _id: 'cat-wiki-getting-started',
      name: 'getting-started',
      displayName: '新手入門',
      description: '新玩家開始旅程的必備指南',
      type: 'wiki',
      order: 1,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'cat-wiki-gameplay',
      name: 'gameplay',
      displayName: '遊戲玩法',
      description: '核心機制、系統和遊戲玩法功能',
      type: 'wiki',
      order: 2,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      _id: 'cat-forum-general',
      name: 'general-discussion',
      displayName: 'General Discussion',
      description: 'General discussions about the server and Minecraft',
      type: 'forum',
      order: 1,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ])
}

/**
 * Create test indexes (mirrors production indexes)
 */
export async function createTestIndexes(): Promise<void> {
  const database = await connectTestDB()

  // Wiki guides indexes
  await database.collection('wikiGuides').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { category: 1, status: 1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { 'author.id': 1 } },
    { key: { tags: 1 } },
    { key: { title: 'text', content: 'text', excerpt: 'text' } }
  ])

  // Blog posts indexes
  await database.collection('blogPosts').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { category: 1, status: 1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { 'author.id': 1 } },
    { key: { tags: 1 } }
  ])

  // Forum posts indexes
  await database.collection('forumPosts').createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { category: 1, isPinned: -1, updatedAt: -1 } },
    { key: { 'author.id': 1 } },
    { key: { isPinned: -1, updatedAt: -1 } },
    { key: { tags: 1 } }
  ])

  // Forum replies indexes
  await database.collection('forumReplies').createIndexes([
    { key: { postId: 1, createdAt: 1 } },
    { key: { postSlug: 1 } },
    { key: { 'author.id': 1 } }
  ])

  // User interactions indexes
  await database.collection('userInteractions').createIndexes([
    { key: { userId: 1, targetId: 1, action: 1 } },
    { key: { targetId: 1, targetType: 1 } },
    { key: { timestamp: -1 } }
  ])

  // Users indexes
  await database.collection('users').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { 'profile.minecraft.username': 1 } },
    { key: { role: 1, status: 1 } }
  ])
}

/**
 * Get test database instance
 */
export function getTestDB(): Db {
  if (!db) {
    throw new Error('Test database not connected. Call connectTestDB() first.')
  }
  return db
}

/**
 * Insert test document and return with generated ID
 */
export async function insertTestDocument(collection: string, document: any): Promise<any> {
  const database = await connectTestDB()
  const result = await database.collection(collection).insertOne(document)
  return { ...document, _id: result.insertedId }
}

/**
 * Find test documents
 */
export async function findTestDocuments(collection: string, query: any = {}, options: any = {}): Promise<any[]> {
  const database = await connectTestDB()
  return database.collection(collection).find(query, options).toArray()
}

/**
 * Count test documents
 */
export async function countTestDocuments(collection: string, query: any = {}): Promise<number> {
  const database = await connectTestDB()
  return database.collection(collection).countDocuments(query)
}

/**
 * Setup test environment
 * Connects to DB, clears data, creates indexes, seeds test data
 */
export async function setupTestEnvironment(): Promise<void> {
  await connectTestDB()
  await clearTestDB()
  await createTestIndexes()
  await seedTestData()
}

/**
 * Teardown test environment
 * Clears data and disconnects from DB
 */
export async function teardownTestEnvironment(): Promise<void> {
  await clearTestDB()
  await disconnectTestDB()
}