import { Db, ObjectId } from 'mongodb'
import { IndexDefinition, IndexStats } from '@/lib/types'

// =============================================
// COMPREHENSIVE DATABASE INDEXES
// =============================================
// 
// This file defines all MongoDB indexes for the Minecraft Server Website.
// Indexes are optimized for the actual query patterns used in the application.
//
// KEY OPTIMIZATION PATTERNS:
// 
// 1. AUTHOR-BASED QUERIES (High Impact):
//    - Uses 'author.id' format (embedded author objects) 
//    - Compound indexes with status + date sorting for performance
//    - Examples: idx_blog_author_id_status_published_optimized
//
// 2. AGGREGATION PIPELINE SUPPORT:
//    - authorObjectId indexes support complex aggregation queries
//    - Sparse indexes since authorObjectId is computed during aggregation
//    - Examples: idx_forum_author_object_id_status
//
// 3. DATE RANGE FILTERING:
//    - Optimized compound indexes for date ranges with category/status filters
//    - Blog uses publishedAt, Wiki uses updatedAt, Forum uses createdAt
//    - Examples: idx_blog_published_date_status_category_optimized
//
// 4. SEARCH OPTIMIZATION:
//    - Category + status + popularity compound indexes for filtered searches
//    - Text indexes for regex-based category searches (Forum)
//    - Examples: idx_wiki_category_difficulty_status_popularity_optimized
//
// 5. EMBEDDED STATS CONSISTENCY:
//    - All popularity indexes use 'stats.viewsCount', 'stats.likesCount' format
//    - Consistent across all content modules (blog, wiki, forum)
//    - Supports modern embedded stats architecture
//
// QUERY PATTERN COVERAGE:
// - ✅ Slug-based lookups (unique indexes)
// - ✅ Author filtering ('author.id' compound indexes)  
// - ✅ Category/status filtering (compound indexes)
// - ✅ Date range queries (optimized compound indexes)
// - ✅ Popularity sorting (embedded stats indexes)
// - ✅ Full-text search (weighted text indexes)
// - ✅ User interactions (compound unique indexes)
// - ✅ Aggregation pipelines (authorObjectId support)
//
// PERFORMANCE NOTES:
// - Compound indexes ordered by selectivity (most selective fields first)
// - Sparse indexes used where fields may not exist (authorObjectId, tags)
// - Text indexes with custom weights (title:10, content:5, tags:8)
// - TTL indexes for automatic cleanup (logs, metrics, notifications)
//

export const COMPREHENSIVE_INDEXES: IndexDefinition[] = [
  // =============================================
  // USERS COLLECTION INDEXES
  // =============================================
  {
    collection: 'users',
    index: { email: 1 },
    options: { unique: true, sparse: true, name: 'idx_users_email_unique' }
  },
  {
    collection: 'users',
    index: { 'providers.discord.id': 1 },
    options: { unique: true, sparse: true, name: 'idx_users_discord_id_unique' }
  },
  {
    collection: 'users',
    index: { role: 1, status: 1 },
    options: { name: 'idx_users_role_status' }
  },
  {
    collection: 'users',
    index: { lastActive: -1 },
    options: { name: 'idx_users_last_active' }
  },
  {
    collection: 'users',
    index: { 'profile.minecraft.username': 1 },
    options: { sparse: true, name: 'idx_users_minecraft_username' }
  },
  {
    collection: 'users',
    index: { 'stats.reputation': -1, 'stats.level': -1 },
    options: { name: 'idx_users_reputation_level' }
  },
  {
    collection: 'users',
    index: { 'stats.contributionScore': -1, 'stats.last30dPosts': -1 },
    options: { name: 'idx_users_contribution_activity' }
  },
  {
    collection: 'users',
    index: { createdAt: -1 },
    options: { name: 'idx_users_created' }
  },

  // =============================================
  // FORUM CATEGORIES COLLECTION INDEXES
  // =============================================
  {
    collection: 'forumCategories',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_categories_slug_unique' }
  },
  {
    collection: 'forumCategories',
    index: { parentId: 1, order: 1 },
    options: { name: 'idx_categories_parent_order' }
  },
  {
    collection: 'forumCategories',
    index: { path: 1 },
    options: { unique: true, name: 'idx_categories_path_unique' }
  },
  {
    collection: 'forumCategories',
    index: { isActive: 1, level: 1, order: 1 },
    options: { name: 'idx_categories_active_level_order' }
  },
  {
    collection: 'forumCategories',
    index: { 'stats.postsCount': -1 },
    options: { name: 'idx_categories_posts_count' }
  },
  {
    collection: 'forumCategories',
    index: { 'stats.lastActivity.createdAt': -1 },
    options: { name: 'idx_categories_last_activity' }
  },

  // =============================================
  // FORUM POSTS COLLECTION INDEXES (OPTIMIZED)
  // =============================================
  
  // Slug index for forum posts (required for slug-based routing)
  {
    collection: 'forumPosts',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_forum_posts_slug_unique' }
  },
  
  // Core query index - covers most common queries (categoryName, status, sorting)
  {
    collection: 'forumPosts',
    index: { categoryName: 1, status: 1, isPinned: -1, lastReplyDate: -1, createdAt: -1 },
    options: { name: 'idx_posts_category_status_sort_optimized' }
  },
  
  // Author queries index
  {
    collection: 'forumPosts',
    index: { author: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_posts_author_status_created' }
  },
  // NEW: Optimized author queries using embedded author.id format
  {
    collection: 'forumPosts',
    index: { 'author.id': 1, status: 1, createdAt: -1 },
    options: { name: 'idx_forum_author_id_status_created_optimized' }
  },
  
  // Post ID lookup (for single post queries)
  {
    collection: 'forumPosts',
    index: { _id: 1, status: 1 },
    options: { name: 'idx_posts_id_status' }
  },
  
  // Full-text search index (optimized for multilingual)
  {
    collection: 'forumPosts',
    index: { title: 'text', content: 'text', tags: 'text' },
    options: {
      name: 'idx_posts_fulltext_search_optimized',
      weights: { title: 10, content: 5, tags: 8 }
    }
  },
  
  // Engagement and popularity sorting (using embedded stats)
  {
    collection: 'forumPosts',
    index: { status: 1, 'stats.viewsCount': -1, 'stats.repliesCount': -1 },
    options: { name: 'idx_posts_popularity_embedded_stats' }
  },
  
  // Tags filtering (sparse index for performance)
  {
    collection: 'forumPosts',
    index: { tags: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_posts_tags_status_created', sparse: true }
  },
  
  // NEW: Aggregation pipeline support - authorObjectId filtering
  {
    collection: 'forumPosts',
    index: { authorObjectId: 1, status: 1 },
    options: { name: 'idx_forum_author_object_id_status', sparse: true }
  },
  
  // NEW: Optimized date range filtering with category support
  {
    collection: 'forumPosts',
    index: { createdAt: -1, status: 1, categoryName: 1 },
    options: { name: 'idx_forum_created_date_status_category_optimized' }
  },
  
  // NEW: Forum category regex search optimization
  {
    collection: 'forumPosts',
    index: { categoryName: 'text', status: 1, isPinned: -1 },
    options: { name: 'idx_forum_category_text_search_optimized' }
  },

  // =============================================
  // FORUM REPLIES COLLECTION INDEXES
  // =============================================
  {
    collection: 'forumReplies',
    index: { postId: 1, createdAt: -1 },
    options: { name: 'idx_replies_post_created' }
  },
  {
    collection: 'forumReplies',
    index: { postId: 1, replyToId: 1, createdAt: 1 },
    options: { name: 'idx_replies_post_parent_created' }
  },
  {
    collection: 'forumReplies',
    index: { author: 1, createdAt: -1 },
    options: { name: 'idx_replies_author_created' }
  },
  // NEW: Optimized author queries using embedded author format
  {
    collection: 'forumReplies',
    index: { 'author.id': 1, postId: 1, createdAt: -1 },
    options: { name: 'idx_replies_author_id_post_created_optimized' }
  },
  {
    collection: 'forumReplies',
    index: { postId: 1, isAcceptedAnswer: 1 },
    options: { 
      name: 'idx_replies_post_accepted',
      partialFilterExpression: { isAcceptedAnswer: true }
    }
  },
  {
    collection: 'forumReplies',
    index: { replyToId: 1, createdAt: 1 },
    options: { 
      name: 'idx_replies_parent_created',
      partialFilterExpression: { replyToId: { $exists: true } }
    }
  },
  {
    collection: 'forumReplies',
    index: { likesCount: -1 },
    options: { name: 'idx_replies_likes' }
  },
  {
    collection: 'forumReplies',
    index: { content: 'text' },
    options: { name: 'idx_replies_fulltext_search' }
  },
  {
    collection: 'forumReplies',
    index: { isDeleted: 1, deletedAt: 1 },
    options: { 
      name: 'idx_replies_soft_delete',
      partialFilterExpression: { isDeleted: true }
    }
  },

  // =============================================
  // USER INTERACTIONS COLLECTION INDEXES
  // =============================================
  {
    collection: 'userInteractions',
    index: { userId: 1, targetType: 1, targetId: 1, interactionType: 1 },
    options: { 
      unique: true, 
      name: 'idx_interactions_user_target_type_unique',
      background: true
    }
  },
  {
    collection: 'userInteractions',
    index: { targetId: 1, interactionType: 1, createdAt: -1 },
    options: { name: 'idx_interactions_target_type_created' }
  },
  {
    collection: 'userInteractions',
    index: { userId: 1, interactionType: 1, createdAt: -1 },
    options: { name: 'idx_interactions_user_type_created' }
  },
  {
    collection: 'userInteractions',
    index: { createdAt: -1 },
    options: { name: 'idx_interactions_created' }
  },
  {
    collection: 'userInteractions',
    index: { targetType: 1, targetId: 1, interactionType: 1, createdAt: -1 },
    options: { name: 'idx_interactions_target_stats' }
  },

  // =============================================
  // BLOG POSTS COLLECTION INDEXES
  // =============================================
  {
    collection: 'blogPosts',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_blog_slug_unique' }
  },
  {
    collection: 'blogPosts',
    index: { status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_status_published' }
  },
  {
    collection: 'blogPosts',
    index: { author: 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_author_status_published' }
  },
  // NEW: Optimized author queries using embedded author.id format
  {
    collection: 'blogPosts',
    index: { 'author.id': 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_author_id_status_published_optimized' }
  },
  {
    collection: 'blogPosts',
    index: { category: 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_category_status_published' }
  },
  {
    collection: 'blogPosts',
    index: { tags: 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_tags_status_published' }
  },
  {
    collection: 'blogPosts',
    index: { 'stats.viewsCount': -1, 'stats.likesCount': -1 },
    options: { name: 'idx_blog_popularity' }
  },
  {
    collection: 'blogPosts',
    index: { title: 'text', content: 'text', tags: 'text' },
    options: {
      name: 'idx_blog_fulltext_search',
      weights: { title: 10, content: 5, tags: 8 }
    }
  },
  {
    collection: 'blogPosts',
    index: { createdAt: -1 },
    options: { name: 'idx_blog_created' }
  },
  {
    collection: 'blogPosts',
    index: { updatedAt: -1 },
    options: { name: 'idx_blog_last_modified' }
  },
  
  // NEW: Aggregation pipeline support - authorObjectId filtering
  {
    collection: 'blogPosts',
    index: { authorObjectId: 1, status: 1 },
    options: { name: 'idx_blog_author_object_id_status', sparse: true }
  },
  
  // NEW: Optimized date range filtering with category support
  {
    collection: 'blogPosts',
    index: { publishedAt: -1, status: 1, category: 1 },
    options: { name: 'idx_blog_published_date_status_category_optimized' }
  },
  
  // NEW: Search optimization - category + status for filtered searches
  {
    collection: 'blogPosts',
    index: { category: 1, status: 1, 'stats.viewsCount': -1, publishedAt: -1 },
    options: { name: 'idx_blog_category_status_popularity_optimized' }
  },

  // =============================================
  // WIKI GUIDES COLLECTION INDEXES
  // =============================================
  {
    collection: 'wikiGuides',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_wiki_slug_unique' }
  },
  {
    collection: 'wikiGuides',
    index: { status: 1, category: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_status_category_modified' }
  },
  {
    collection: 'wikiGuides',
    index: { author: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_wiki_author_status_created' }
  },
  // NEW: Optimized author queries using embedded author.id format
  {
    collection: 'wikiGuides',
    index: { 'author.id': 1, status: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_author_id_status_updated_optimized' }
  },
  {
    collection: 'wikiGuides',
    index: { category: 1, difficulty: 1, 'stats.viewsCount': -1 },
    options: { name: 'idx_wiki_category_difficulty_views' }
  },
  {
    collection: 'wikiGuides',
    index: { tags: 1, status: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_tags_status_modified' }
  },
  {
    collection: 'wikiGuides',
    index: { 'stats.viewsCount': -1, 'stats.likesCount': -1 },
    options: { name: 'idx_wiki_popularity' }
  },
  {
    collection: 'wikiGuides',
    index: { title: 'text', content: 'text', tags: 'text' },
    options: {
      name: 'idx_wiki_fulltext_search',
      weights: { title: 10, content: 5, tags: 8 }
    }
  },
  
  // NEW: Aggregation pipeline support - authorObjectId filtering
  {
    collection: 'wikiGuides',
    index: { authorObjectId: 1, status: 1 },
    options: { name: 'idx_wiki_author_object_id_status', sparse: true }
  },
  
  // NEW: Optimized date range filtering with category and difficulty support
  {
    collection: 'wikiGuides',
    index: { updatedAt: -1, status: 1, category: 1, difficulty: 1 },
    options: { name: 'idx_wiki_updated_date_status_category_difficulty_optimized' }
  },
  
  // NEW: Search optimization - category + difficulty + status for filtered searches  
  {
    collection: 'wikiGuides',
    index: { category: 1, difficulty: 1, status: 1, 'stats.viewsCount': -1, updatedAt: -1 },
    options: { name: 'idx_wiki_category_difficulty_status_popularity_optimized' }
  },

  // =============================================
  // WIKI CATEGORIES COLLECTION INDEXES
  // =============================================
  {
    collection: 'wikiCategories',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_wiki_categories_slug_unique' }
  },
  {
    collection: 'wikiCategories',
    index: { isActive: 1, order: 1 },
    options: { name: 'idx_wiki_categories_active_order' }
  },

  // =============================================
  // SERVER METRICS COLLECTION INDEXES
  // =============================================
  {
    collection: 'serverMetrics',
    index: { name: 1, timestamp: -1 },
    options: { name: 'idx_server_metrics_name_timestamp' }
  },
  {
    collection: 'serverMetrics',
    index: { timestamp: -1 },
    options: { name: 'idx_server_metrics_timestamp' }
  },
  {
    collection: 'serverMetrics',
    index: { isOnline: 1, timestamp: -1 },
    options: { name: 'idx_server_metrics_status_timestamp' }
  },
  {
    collection: 'serverMetrics',
    index: { timestamp: 1 },
    options: { 
      name: 'idx_server_metrics_ttl',
      expireAfterSeconds: 2592000 // 30 days
    }
  },

  // =============================================
  // ACTIVITY LOGS COLLECTION INDEXES
  // =============================================
  {
    collection: 'activityLogs',
    index: { userId: 1, timestamp: -1 },
    options: { name: 'idx_activity_user_timestamp' }
  },
  {
    collection: 'activityLogs',
    index: { action: 1, targetType: 1, timestamp: -1 },
    options: { name: 'idx_activity_action_type_timestamp' }
  },
  {
    collection: 'activityLogs',
    index: { targetId: 1, action: 1, timestamp: -1 },
    options: { name: 'idx_activity_target_action_timestamp' }
  },
  {
    collection: 'activityLogs',
    index: { timestamp: -1 },
    options: { name: 'idx_activity_timestamp' }
  },
  {
    collection: 'activityLogs',
    index: { timestamp: 1 },
    options: { 
      name: 'idx_activity_ttl',
      expireAfterSeconds: 7776000 // 90 days
    }
  },

  // =============================================
  // NOTIFICATIONS COLLECTION INDEXES
  // =============================================
  {
    collection: 'notifications',
    index: { userId: 1, read: 1, createdAt: -1 },
    options: { name: 'idx_notifications_user_read_created' }
  },
  {
    collection: 'notifications',
    index: { userId: 1, type: 1, createdAt: -1 },
    options: { name: 'idx_notifications_user_type_created' }
  },
  {
    collection: 'notifications',
    index: { createdAt: 1 },
    options: { 
      name: 'idx_notifications_ttl',
      expireAfterSeconds: 7776000 // 90 days for read notifications
    }
  },

  // =============================================
  // SEARCH INDEX COLLECTION INDEXES
  // =============================================
  {
    collection: 'searchIndex',
    index: { resourceType: 1, resourceId: 1 },
    options: { unique: true, name: 'idx_search_resource_unique' }
  },
  {
    collection: 'searchIndex',
    index: { content: 'text', title: 'text', keywords: 'text' },
    options: {
      name: 'idx_search_fulltext',
      weights: { title: 10, content: 5, keywords: 8 }
    }
  },
  {
    collection: 'searchIndex',
    index: { resourceType: 1, language: 1, searchScore: -1 },
    options: { name: 'idx_search_type_language_score' }
  },
  {
    collection: 'searchIndex',
    index: { lastIndexedAt: 1 },
    options: { name: 'idx_search_last_indexed' }
  },
  {
    collection: 'searchIndex',
    index: { 'metadata.categoryId': 1, resourceType: 1 },
    options: { name: 'idx_search_category_type' }
  },
]

// =============================================
// INDEX MANAGEMENT FUNCTIONS
// =============================================

export async function createAllIndexes(db: Db): Promise<void> {
  console.log('🔧 Starting comprehensive index creation...')
  console.log(`📊 Total indexes to create: ${COMPREHENSIVE_INDEXES.length}`)
  
  const results = []
  const newIndexes = []
  
  for (const indexDef of COMPREHENSIVE_INDEXES) {
    try {
      const collection = db.collection(indexDef.collection)
      const indexName = indexDef.options?.name || 'unnamed'
      
      // Check if this is a new optimization index
      const isNewIndex = indexName.includes('_optimized') || indexName.includes('_object_id')
      if (isNewIndex) {
        newIndexes.push(indexName)
      }
      
      console.log(`Creating index ${indexName} on ${indexDef.collection}...`)
      
      const result = await collection.createIndex(
        indexDef.index,
        indexDef.options || {}
      )
      
      results.push({
        collection: indexDef.collection,
        index: indexName,
        status: 'created',
        isNew: isNewIndex
      })
      
      console.log(`✅ Created index: ${indexName}${isNewIndex ? ' (NEW OPTIMIZATION)' : ''}`)
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      // Check if error is due to index already existing
      if (errorMsg.includes('already exists')) {
        console.log(`⚠️ Index already exists: ${indexDef.options?.name || 'unnamed'} on ${indexDef.collection}`)
        results.push({
          collection: indexDef.collection,
          index: indexDef.options?.name || 'unknown',
          status: 'exists'
        })
      } else {
        console.error(`❌ Failed to create index on ${indexDef.collection}:`, error)
        results.push({
          collection: indexDef.collection,
          index: indexDef.options?.name || 'unknown',
          status: 'failed',
          error: errorMsg
        })
      }
    }
  }
  
  console.log('\n📊 Index Creation Summary:')
  console.log(`✅ Successfully created: ${results.filter(r => r.status === 'created').length}`)
  console.log(`⚠️ Already existed: ${results.filter(r => r.status === 'exists').length}`)
  console.log(`❌ Failed: ${results.filter(r => r.status === 'failed').length}`)
  console.log(`📈 Total processed: ${results.length}`)
  
  if (newIndexes.length > 0) {
    console.log('\n🚀 New optimization indexes added:')
    newIndexes.forEach(name => console.log(`  - ${name}`))
  }
  
  const failed = results.filter(r => r.status === 'failed')
  if (failed.length > 0) {
    console.log('\n❌ Failed indexes:')
    failed.forEach(f => console.log(`  - ${f.collection}.${f.index}: ${f.error}`))
  }
}

export async function dropAllIndexes(db: Db): Promise<void> {
  console.log('🗑️ Dropping all custom indexes...')
  
  const collections = [
    'users', 'forumCategories', 'forumPosts', 'forumReplies', 'userInteractions',
    'blogPosts', 'wikiGuides', 'wikiCategories', 'serverMetrics', 'activityLogs', 
    'notifications', 'searchIndex'
  ]
  
  for (const collectionName of collections) {
    try {
      const collection = db.collection(collectionName)
      const indexes = await collection.indexes()
      
      for (const index of indexes) {
        if (index.name && index.name !== '_id_') { // Don't drop the default _id index
          await collection.dropIndex(index.name)
          console.log(`✅ Dropped index: ${collectionName}.${index.name}`)
        }
      }
    } catch (error) {
      console.error(`❌ Failed to drop indexes for ${collectionName}:`, error)
    }
  }
}

export async function getIndexStats(db: Db): Promise<Record<string, IndexStats>> {
  console.log('📊 Gathering index statistics...')
  
  const stats: Record<string, IndexStats> = {}
  
  const collections = await db.listCollections().toArray()
  
  for (const collection of collections) {
    try {
      const coll = db.collection(collection.name)
      const indexes = await coll.indexes()
      const indexStats = await coll.aggregate([{ $indexStats: {} }]).toArray()
      
      stats[collection.name] = {
        indexes: indexes.map(idx => ({
          name: idx.name || 'unnamed', // Provide default name if undefined
          keys: idx.key as Record<string, "text" | 1 | -1>,
          unique: idx.unique || false,
          sparse: idx.sparse || false,
          background: idx.background || false
        })),
        usage: indexStats.length
      }
    } catch (error) {
      console.error(`❌ Failed to get stats for ${collection.name}:`, error)
    }
  }
  
  return stats
}

export async function validateIndexes(db: Db): Promise<boolean> {
  console.log('🔍 Validating index performance...')
  
  let allValid = true
  
  // Test queries that should use indexes efficiently
  // Using placeholder ObjectIds for validation queries
  const testObjectId = new ObjectId()
  const testUserId = testObjectId.toString()
  const testQueries = [
    {
      collection: 'forumPosts',
      query: { categoryName: 'general', status: 'published' },
      description: 'Forum posts by category and status'
    },
    {
      collection: 'forumPosts',
      query: { 'author.id': testUserId, status: 'published' },
      description: 'Forum posts by author.id (NEW INDEX)'
    },
    {
      collection: 'forumPosts',
      query: { authorObjectId: testObjectId, status: 'published' },
      description: 'Forum posts by authorObjectId (NEW INDEX)'
    },
    {
      collection: 'blogPosts',
      query: { 'author.id': testUserId, status: 'published' },
      description: 'Blog posts by author.id (NEW INDEX)'
    },
    {
      collection: 'blogPosts',
      query: { category: 'tech', status: 'published', 'stats.viewsCount': { $gte: 0 } },
      description: 'Blog posts category + popularity (NEW INDEX)'
    },
    {
      collection: 'wikiGuides',
      query: { 'author.id': testUserId, status: 'published' },
      description: 'Wiki guides by author.id (NEW INDEX)'
    },
    {
      collection: 'wikiGuides',
      query: { category: 'getting-started', difficulty: 'beginner', status: 'published' },
      description: 'Wiki guides by category + difficulty + status (NEW INDEX)'
    },
    {
      collection: 'forumReplies',
      query: { 'author.id': testUserId, postId: testObjectId },
      description: 'Forum replies by author.id + postId (NEW INDEX)'
    },
    {
      collection: 'forumReplies',
      query: { postId: testObjectId },
      description: 'Replies by post'
    },
    {
      collection: 'users',
      query: { email: { $exists: true } },
      description: 'User by email exists'
    },
    {
      collection: 'userInteractions',
      query: { userId: testUserId, targetType: 'post', interactionType: 'like' },
      description: 'User interactions'
    }
  ]
  
  for (const test of testQueries) {
    try {
      const collection = db.collection(test.collection)
      const explain = await collection.find(test.query).explain('executionStats')
      
      const executionStats = explain.executionStats
      const indexUsed = executionStats.totalDocsExamined === executionStats.totalDocsReturned
      
      if (indexUsed) {
        console.log(`✅ ${test.description}: Efficient index usage`)
      } else {
        console.log(`⚠️ ${test.description}: Inefficient query - examined ${executionStats.totalDocsExamined} docs, returned ${executionStats.totalDocsReturned}`)
        allValid = false
      }
    } catch (error) {
      console.error(`❌ Failed to validate ${test.description}:`, error)
      allValid = false
    }
  }
  
  return allValid
}