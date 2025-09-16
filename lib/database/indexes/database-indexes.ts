import { Db, ObjectId } from 'mongodb'
import { IndexDefinition, IndexStats } from '@/lib/types'

// =============================================
// OPTIMIZED DATABASE INDEXES
// =============================================
// 
// This file defines all MongoDB indexes for the Minecraft Server Website.
// Indexes are based on comprehensive analysis of actual query patterns and usage.
//
// KEY OPTIMIZATION PATTERNS:
// 
// 1. EMBEDDED AUTHOR QUERIES (Highest Priority):
//    - All content uses embedded 'author.id' format for fast lookups
//    - Compound indexes with status + date sorting for core query patterns
//    - Supports both individual content and aggregation pipeline queries
//
// 2. CATEGORY + STATUS + SORTING (High Priority):
//    - Compound indexes optimized for filtered content browsing
//    - Forum: categoryName + status + isPinned + dates
//    - Blog: category + status + publishedAt  
//    - Wiki: category + difficulty + status + stats
//    - Dex: category + element + rarity + stats
//
// 3. POPULARITY & ENGAGEMENT (High Priority):
//    - Embedded stats pattern: stats.viewsCount, stats.likesCount, etc.
//    - Real-time social interaction requirements
//    - Trending content algorithms
//
// 4. FULL-TEXT SEARCH (Medium Priority):
//    - Multi-module unified search capability
//    - Weighted text indexes with relevance scoring
//    - Cross-module search federation
//
// 5. USER INTERACTIONS (Critical for Social Features):
//    - Unique constraint prevention of duplicate interactions
//    - Fast user-specific state queries for personalization
//    - Social engagement analytics
//
// QUERY PATTERN COVERAGE:
// - ✅ Content listing by category/status (most common)
// - ✅ Author-specific content filtering (dashboard/profiles)
// - ✅ Popularity rankings and trending content
// - ✅ User interaction states (likes/bookmarks/helpful)
// - ✅ Full-text search across all modules
// - ✅ Date range filtering for analytics
// - ✅ Real-time WebSocket stat updates
// - ✅ Aggregation pipeline optimization
//
// PERFORMANCE NOTES:
// - Indexes ordered by actual query frequency and selectivity
// - Sparse indexes for optional/computed fields (authorObjectId, tags)
// - TTL indexes for automatic cleanup (metrics, logs, notifications)
// - Compound indexes support multiple query variations
//

export const OPTIMIZED_INDEXES: IndexDefinition[] = [
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
    index: { 'profile.username': 1 },
    options: { unique: true, name: 'idx_users_username_unique' }
  },
  {
    collection: 'users',
    index: { role: 1, status: 1 },
    options: { name: 'idx_users_role_status' }
  },
  {
    collection: 'users',
    index: { lastActiveAt: -1 },
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
    index: { 'stats.contributionScore': -1, 'stats.last30daysPostsCount': -1 },
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
    options: { unique: true, name: 'idx_forum_categories_slug_unique' }
  },
  {
    collection: 'forumCategories',
    index: { parentId: 1, order: 1 },
    options: { name: 'idx_forum_categories_parent_order' }
  },
  {
    collection: 'forumCategories',
    index: { path: 1 },
    options: { unique: true, name: 'idx_forum_categories_path_unique' }
  },
  {
    collection: 'forumCategories',
    index: { isActive: 1, level: 1, order: 1 },
    options: { name: 'idx_forum_categories_active_level_order' }
  },
  {
    collection: 'forumCategories',
    index: { 'stats.postsCount': -1, 'stats.lastActivity.createdAt': -1 },
    options: { name: 'idx_forum_categories_activity' }
  },

  // =============================================
  // FORUM POSTS COLLECTION INDEXES (CRITICAL PATH OPTIMIZED)
  // =============================================
  
  // 1. SLUG ROUTING (Required for all content access)
  {
    collection: 'forumPosts',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_forum_posts_slug_unique' }
  },
  
  // 2. PRIMARY LISTING QUERY (Highest frequency - category browsing)
  {
    collection: 'forumPosts',
    index: { categoryName: 1, status: 1, isPinned: -1, createdAt: -1 },
    options: { name: 'idx_forum_posts_category_status_pinned_created' }
  },
  
  // 3. AUTHOR CONTENT (Dashboard, profiles - high frequency)
  {
    collection: 'forumPosts',
    index: { 'author.id': 1, status: 1, createdAt: -1 },
    options: { name: 'idx_forum_posts_author_id_status_created' }
  },
  
  // 4. POPULARITY RANKING (Trending, popular content)
  {
    collection: 'forumPosts',
    index: { status: 1, 'stats.viewsCount': -1, 'stats.repliesCount': -1, 'stats.likesCount': -1 },
    options: { name: 'idx_forum_posts_popularity_stats' }
  },
  
  // 5. FULL-TEXT SEARCH (Multi-module search)
  {
    collection: 'forumPosts',
    index: { title: 'text', content: 'text', tags: 'text' },
    options: {
      name: 'idx_forum_posts_fulltext_search',
      weights: { title: 10, content: 5, tags: 8 }
    }
  },
  
  // 6. AGGREGATION PIPELINE SUPPORT (Author lookup optimization)
  {
    collection: 'forumPosts',
    index: { authorObjectId: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_forum_posts_author_object_id_aggregation', sparse: true }
  },
  
  // 7. DATE RANGE FILTERING (Analytics, reports)
  {
    collection: 'forumPosts',
    index: { createdAt: -1, status: 1, categoryName: 1 },
    options: { name: 'idx_forum_posts_date_range_category' }
  },
  
  // 8. TAG-BASED FILTERING (Content discovery)
  {
    collection: 'forumPosts',
    index: { tags: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_forum_posts_tags_status_created', sparse: true }
  },

  // =============================================
  // FORUM REPLIES COLLECTION INDEXES
  // =============================================
  
  // 1. POST REPLIES LISTING (Primary query for reply display)
  {
    collection: 'forumReplies',
    index: { postId: 1, createdAt: -1 },
    options: { name: 'idx_forum_replies_post_created' }
  },
  
  // 2. THREADED REPLIES (Parent-child relationships)
  {
    collection: 'forumReplies',
    index: { postId: 1, replyToId: 1, createdAt: 1 },
    options: { name: 'idx_forum_replies_thread_structure' }
  },
  
  // 3. AUTHOR REPLIES (User content, dashboard)
  {
    collection: 'forumReplies',
    index: { 'author.id': 1, createdAt: -1 },
    options: { name: 'idx_forum_replies_author_id_created' }
  },
  
  // 4. ACCEPTED ANSWERS (Solution marking)
  {
    collection: 'forumReplies',
    index: { postId: 1, isAcceptedAnswer: 1 },
    options: { 
      name: 'idx_forum_replies_accepted_answers',
      partialFilterExpression: { isAcceptedAnswer: true }
    }
  },
  
  // 5. POPULARITY RANKING (Top replies by engagement)
  {
    collection: 'forumReplies',
    index: { postId: 1, 'stats.likesCount': -1, createdAt: -1 },
    options: { name: 'idx_forum_replies_popularity' }
  },
  
  // 6. FULL-TEXT SEARCH (Reply content search)
  {
    collection: 'forumReplies',
    index: { content: 'text' },
    options: { name: 'idx_forum_replies_fulltext_search' }
  },

  // =============================================
  // USER INTERACTIONS COLLECTION INDEXES (CRITICAL FOR SOCIAL FEATURES)
  // =============================================
  
  // 1. UNIQUE INTERACTION CONSTRAINT (Prevents duplicate likes/bookmarks)
  {
    collection: 'userInteractions',
    index: { userId: 1, targetType: 1, targetId: 1, interactionType: 1 },
    options: { 
      unique: true, 
      name: 'idx_user_interactions_unique_constraint'
    }
  },
  
  // 2. USER ACTIVITY QUERIES (User dashboard, profile pages)
  {
    collection: 'userInteractions',
    index: { userId: 1, interactionType: 1, createdAt: -1 },
    options: { name: 'idx_user_interactions_user_activity' }
  },
  
  // 3. CONTENT ENGAGEMENT STATS (Real-time stats aggregation)
  {
    collection: 'userInteractions',
    index: { targetId: 1, targetType: 1, interactionType: 1, createdAt: -1 },
    options: { name: 'idx_user_interactions_content_stats' }
  },
  
  // 4. RECENT ACTIVITY FEED (Timeline queries)
  {
    collection: 'userInteractions',
    index: { createdAt: -1, interactionType: 1 },
    options: { name: 'idx_user_interactions_recent_activity' }
  },
  
  // 5. USER STATE LOOKUP (Personalized interaction state)
  {
    collection: 'userInteractions',
    index: { userId: 1, targetId: 1, interactionType: 1 },
    options: { name: 'idx_user_interactions_state_lookup' }
  },

  // =============================================
  // BLOG POSTS COLLECTION INDEXES
  // =============================================
  
  // 1. SLUG ROUTING (Required for all blog post access)
  {
    collection: 'blogPosts',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_blog_posts_slug_unique' }
  },
  
  // 2. PUBLICATION STATUS (Primary listing query)
  {
    collection: 'blogPosts',
    index: { status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_posts_status_published' }
  },
  
  // 3. AUTHOR CONTENT (Author profile, dashboard)
  {
    collection: 'blogPosts',
    index: { 'author.id': 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_posts_author_id_status_published' }
  },
  
  // 4. CATEGORY FILTERING (Content discovery)
  {
    collection: 'blogPosts',
    index: { category: 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_posts_category_status_published' }
  },
  
  // 5. POPULARITY RANKING (Trending content)
  {
    collection: 'blogPosts',
    index: { status: 1, 'stats.viewsCount': -1, 'stats.likesCount': -1, publishedAt: -1 },
    options: { name: 'idx_blog_posts_popularity_stats' }
  },
  
  // 6. FULL-TEXT SEARCH (Blog search functionality)
  {
    collection: 'blogPosts',
    index: { title: 'text', content: 'text', tags: 'text' },
    options: {
      name: 'idx_blog_posts_fulltext_search',
      weights: { title: 10, content: 5, tags: 8 }
    }
  },
  
  // 7. TAG-BASED FILTERING (Content organization)
  {
    collection: 'blogPosts',
    index: { tags: 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_posts_tags_status_published', sparse: true }
  },
  
  // 8. AGGREGATION PIPELINE SUPPORT
  {
    collection: 'blogPosts',
    index: { authorObjectId: 1, status: 1, publishedAt: -1 },
    options: { name: 'idx_blog_posts_author_object_id_aggregation', sparse: true }
  },

  // =============================================
  // WIKI GUIDES COLLECTION INDEXES
  // =============================================
  
  // 1. SLUG ROUTING (Required for all wiki guide access)
  {
    collection: 'wikiGuides',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_wiki_guides_slug_unique' }
  },
  
  // 2. CATEGORY + DIFFICULTY FILTERING (Primary wiki browsing pattern)
  {
    collection: 'wikiGuides',
    index: { category: 1, difficulty: 1, status: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_guides_category_difficulty_status_updated' }
  },
  
  // 3. AUTHOR CONTENT (Guide authoring, admin tools)
  {
    collection: 'wikiGuides',
    index: { 'author.id': 1, status: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_guides_author_id_status_updated' }
  },
  
  // 4. HELPFULNESS RANKING (Community-validated guides)
  {
    collection: 'wikiGuides',
    index: { status: 1, 'stats.helpfulsCount': -1, 'stats.viewsCount': -1, updatedAt: -1 },
    options: { name: 'idx_wiki_guides_helpfulness_popularity' }
  },
  
  // 5. FULL-TEXT SEARCH (Knowledge base search)
  {
    collection: 'wikiGuides',
    index: { title: 'text', content: 'text', tags: 'text' },
    options: {
      name: 'idx_wiki_guides_fulltext_search',
      weights: { title: 10, content: 5, tags: 8 }
    }
  },
  
  // 6. TAG-BASED FILTERING (Content organization)
  {
    collection: 'wikiGuides',
    index: { tags: 1, status: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_guides_tags_status_updated', sparse: true }
  },
  
  // 7. AGGREGATION PIPELINE SUPPORT
  {
    collection: 'wikiGuides',
    index: { authorObjectId: 1, status: 1, updatedAt: -1 },
    options: { name: 'idx_wiki_guides_author_object_id_aggregation', sparse: true }
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
  // DEX MONSTERS COLLECTION INDEXES (MISSING - CRITICAL!)
  // =============================================
  
  // 1. SLUG ROUTING (Required for all monster access)
  {
    collection: 'dexMonsters',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_dex_monsters_slug_unique' }
  },
  
  // 2. CATEGORY + ELEMENT FILTERING (Primary dex browsing pattern)
  {
    collection: 'dexMonsters',
    index: { category: 1, element: 1, 'stats.level': 1 },
    options: { name: 'idx_dex_monsters_category_element_level' }
  },
  
  // 3. RARITY + STATS RANKING (Monster discovery, power ranking)
  {
    collection: 'dexMonsters',
    index: { rarity: 1, 'stats.hp': -1, 'stats.attack': -1 },
    options: { name: 'idx_dex_monsters_rarity_power_stats' }
  },
  
  // 4. SPAWN LOCATION FILTERING (Location-based discovery)
  {
    collection: 'dexMonsters',
    index: { 'spawnInfo.biome': 1, 'spawnInfo.rarity': 1, 'stats.level': 1 },
    options: { name: 'idx_dex_monsters_spawn_location_level' }
  },
  
  // 5. FULL-TEXT SEARCH (Monster search by name, description)
  {
    collection: 'dexMonsters',
    index: { name: 'text', description: 'text', abilities: 'text' },
    options: {
      name: 'idx_dex_monsters_fulltext_search',
      weights: { name: 10, description: 5, abilities: 8 }
    }
  },
  
  // 6. EVOLUTION CHAIN QUERIES
  {
    collection: 'dexMonsters',
    index: { 'evolution.from': 1, 'evolution.to': 1 },
    options: { name: 'idx_dex_monsters_evolution_chain', sparse: true }
  },
  
  // 7. DROP ITEM FILTERING (Farming guides)
  {
    collection: 'dexMonsters',
    index: { 'drops.item': 1, 'drops.rarity': 1 },
    options: { name: 'idx_dex_monsters_drops', sparse: true }
  },
  
  // =============================================
  // DEX CATEGORIES COLLECTION INDEXES (MISSING!)
  // =============================================
  {
    collection: 'dexCategories',
    index: { slug: 1 },
    options: { unique: true, name: 'idx_dex_categories_slug_unique' }
  },
  {
    collection: 'dexCategories',
    index: { isActive: 1, order: 1 },
    options: { name: 'idx_dex_categories_active_order' }
  },
  {
    collection: 'dexCategories',
    index: { 'stats.monstersCount': -1 },
    options: { name: 'idx_dex_categories_monster_count' }
  },

  // =============================================
  // ANALYTICS & SYSTEM COLLECTIONS INDEXES
  // =============================================
  
  // SERVER METRICS (Performance monitoring with TTL)
  {
    collection: 'serverMetrics',
    index: { serverId: 1, createdAt: -1 },
    options: { name: 'idx_server_metrics_server_created' }
  },
  {
    collection: 'serverMetrics',
    index: { status: 1, createdAt: -1 },
    options: { name: 'idx_server_metrics_status_created' }
  },
  {
    collection: 'serverMetrics',
    index: { createdAt: 1 },
    options: { 
      name: 'idx_server_metrics_ttl',
      expireAfterSeconds: 2592000 // 30 days auto-cleanup
    }
  },

  // ACTIVITY LOGS (Audit trail with TTL)
  {
    collection: 'activityLogs',
    index: { 'actor.id': 1, createdAt: -1 },
    options: { name: 'idx_activity_logs_actor_created' }
  },
  {
    collection: 'activityLogs',
    index: { 'action.type': 1, 'action.resource': 1, createdAt: -1 },
    options: { name: 'idx_activity_logs_action_type_resource_created' }
  },
  {
    collection: 'activityLogs',
    index: { riskLevel: 1, createdAt: -1 },
    options: { name: 'idx_activity_logs_risk_level_created' }
  },
  {
    collection: 'activityLogs',
    index: { createdAt: 1 },
    options: { 
      name: 'idx_activity_logs_ttl',
      expireAfterSeconds: 7776000 // 90 days auto-cleanup
    }
  },

  // NOTIFICATIONS (User messaging)
  {
    collection: 'notifications',
    index: { userId: 1, status: 1, createdAt: -1 },
    options: { name: 'idx_notifications_user_status_created' }
  },
  {
    collection: 'notifications',
    index: { userId: 1, type: 1, createdAt: -1 },
    options: { name: 'idx_notifications_user_type_created' }
  },
  {
    collection: 'notifications',
    index: { groupKey: 1, createdAt: -1 },
    options: { name: 'idx_notifications_group_key_created', sparse: true }
  },
  {
    collection: 'notifications',
    index: { createdAt: 1 },
    options: { 
      name: 'idx_notifications_ttl',
      expireAfterSeconds: 7776000 // 90 days auto-cleanup
    }
  },

  // SEARCH INDEX (Full-text search optimization)
  {
    collection: 'searchIndex',
    index: { resourceType: 1, resourceId: 1 },
    options: { unique: true, name: 'idx_search_index_resource_unique' }
  },
  {
    collection: 'searchIndex',
    index: { content: 'text', title: 'text', keywords: 'text' },
    options: {
      name: 'idx_search_index_fulltext',
      weights: { title: 10, content: 5, keywords: 8 }
    }
  },
  {
    collection: 'searchIndex',
    index: { resourceType: 1, language: 1, searchScore: -1 },
    options: { name: 'idx_search_index_type_language_score' }
  },
  {
    collection: 'searchIndex',
    index: { isIndexed: 1, lastIndexedAt: -1 },
    options: { name: 'idx_search_index_status_last_indexed' }
  },
  {
    collection: 'searchIndex',
    index: { 'metadata.categoryId': 1, resourceType: 1, language: 1 },
    options: { name: 'idx_search_index_category_type_language' }
  },
]

// =============================================
// INDEX MANAGEMENT FUNCTIONS
// =============================================

export async function createAllIndexes(db: Db): Promise<void> {
  
  const results = []
  const newIndexes = []
  
  for (const indexDef of OPTIMIZED_INDEXES) {
    try {
      const collection = db.collection(indexDef.collection)
      const indexName = indexDef.options?.name || 'unnamed'
      
      // Check if this is a new optimization index
      const isNewIndex = indexName.includes('_optimized') || indexName.includes('_object_id')
      if (isNewIndex) {
        newIndexes.push(indexName)
      }
      
      // Creating index
      
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
      
      // Index created successfully
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      // Check if error is due to index already existing
      if (errorMsg.includes('already exists')) {
        // Index already exists
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
  
  // Index creation completed
}

export async function dropAllIndexes(db: Db): Promise<void> {
  // Dropping all custom indexes
  
  const collections = [
    'users', 'forumCategories', 'forumPosts', 'forumReplies', 'userInteractions',
    'blogPosts', 'wikiGuides', 'wikiCategories', 'dexMonsters', 'dexCategories',
    'serverMetrics', 'activityLogs', 'notifications', 'searchIndex'
  ]
  
  for (const collectionName of collections) {
    try {
      const collection = db.collection(collectionName)
      const indexes = await collection.indexes()
      
      for (const index of indexes) {
        if (index.name && index.name !== '_id_') { // Don't drop the default _id index
          await collection.dropIndex(index.name)
          // Index dropped successfully
        }
      }
    } catch (error) {
      console.error(`❌ Failed to drop indexes for ${collectionName}:`, error)
    }
  }
}

export async function getIndexStats(db: Db): Promise<Record<string, IndexStats>> {
  
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
  
  let allValid = true
  
  // Test queries that should use optimized indexes efficiently
  // Using placeholder ObjectIds for validation queries
  const testObjectId = new ObjectId()
  const testUserId = testObjectId.toString()
  const testQueries = [
    {
      collection: 'forumPosts',
      query: { categoryName: 'general', status: 'published' },
      description: 'Forum posts by category and status (PRIMARY INDEX)'
    },
    {
      collection: 'forumPosts',
      query: { 'author.id': testUserId, status: 'published' },
      description: 'Forum posts by author.id (EMBEDDED AUTHOR INDEX)'
    },
    {
      collection: 'blogPosts',
      query: { 'author.id': testUserId, status: 'published' },
      description: 'Blog posts by author.id (EMBEDDED AUTHOR INDEX)'
    },
    {
      collection: 'wikiGuides',
      query: { category: 'getting-started', difficulty: 'beginner', status: 'published' },
      description: 'Wiki guides by category + difficulty + status (COMPOUND INDEX)'
    },
    {
      collection: 'dexMonsters',
      query: { category: 'beast', element: 'fire' },
      description: 'Dex monsters by category + element (NEW DEX INDEX)'
    },
    {
      collection: 'dexMonsters',
      query: { slug: 'fire-dragon' },
      description: 'Dex monster by slug (UNIQUE INDEX)'
    },
    {
      collection: 'userInteractions',
      query: { userId: testUserId, targetType: 'post', targetId: testObjectId, interactionType: 'like' },
      description: 'User interactions unique constraint (CRITICAL INDEX)'
    },
    {
      collection: 'forumReplies',
      query: { postId: testObjectId },
      description: 'Forum replies by post (PRIMARY REPLIES INDEX)'
    },
    {
      collection: 'users',
      query: { 'profile.username': 'testuser' },
      description: 'User by username (UNIQUE INDEX)'
    },
    {
      collection: 'notifications',
      query: { userId: testObjectId, status: 'unread' },
      description: 'User notifications by status (USER MESSAGING INDEX)'
    }
  ]
  
  for (const test of testQueries) {
    try {
      const collection = db.collection(test.collection)
      const explain = await collection.find(test.query).explain('executionStats')
      
      const executionStats = explain.executionStats
      const indexUsed = executionStats.totalDocsExamined === executionStats.totalDocsReturned
      
      if (indexUsed) {
        // Efficient index usage
      } else {
        // Inefficient query detected
        allValid = false
      }
    } catch (error) {
      console.error(`❌ Failed to validate ${test.description}:`, error)
      allValid = false
    }
  }
  
  return allValid
}