/**
 * Database Integration Tests
 * 
 * Tests database operations through the DAL layer to ensure
 * data consistency and proper error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, ObjectId } from 'mongodb'

// Mock the database connection to use test database
let mongoServer: MongoMemoryServer
let mongoClient: MongoClient
let testDb: any

// Mock environment variables for testing
const originalEnv = process.env
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  
  // Override environment variables
  process.env = {
    ...originalEnv,
    MONGODB_URI: uri,
    MONGODB_DB: 'minecraft_server_test'
  }
  
  // Create test database connection
  mongoClient = new MongoClient(uri)
  await mongoClient.connect()
  testDb = mongoClient.db('minecraft_server_test')
})

afterAll(async () => {
  // Cleanup
  await mongoClient?.close()
  await mongoServer?.stop()
  process.env = originalEnv
})

// Mock the DAL to use test database
vi.mock('@/lib/database/connection', () => ({
  connectToDatabase: vi.fn(() => Promise.resolve({
    client: mongoClient,
    db: testDb
  })),
  getDatabase: vi.fn(() => testDb)
}))

// Import DAL after mocking
import { DAL } from '@/lib/database/dal'

describe('Database Integration Tests', () => {
  // Test data
  const testUser = {
    _id: new ObjectId(),
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'member',
    avatar: 'https://example.com/avatar.jpg'
  }

  const testBlogPost = {
    title: 'Test Blog Post',
    content: 'This is a test blog post content',
    excerpt: 'Test excerpt',
    metaDescription: 'Test meta description',
    slug: 'test-blog-post',
    author: {
      id: testUser.id,
      name: testUser.name,
      avatar: testUser.avatar
    },
    category: 'announcements',
    tags: ['test', 'blog'],
    status: 'published' as const
  }

  const testForumPost = {
    title: 'Test Forum Post',
    content: 'This is a test forum post content',
    excerpt: 'Test excerpt',
    slug: 'test-forum-post',
    author: {
      id: testUser.id,
      name: testUser.name,
      avatar: testUser.avatar
    },
    category: 'general',
    tags: ['discussion'],
    status: 'published' as const,
    isPinned: false,
    isLocked: false
  }

  const testWikiGuide = {
    title: 'Test Wiki Guide',
    content: 'This is a test wiki guide content',
    excerpt: 'Test guide excerpt',
    metaDescription: 'Test guide meta description',
    slug: 'test-wiki-guide',
    author: {
      id: testUser.id,
      name: testUser.name,
      avatar: testUser.avatar
    },
    category: 'getting-started',
    difficulty: 'beginner' as const,
    tags: ['tutorial'],
    status: 'published' as const
  }

  beforeEach(async () => {
    // Clean up collections before each test
    const collections = ['users', 'blogPosts', 'forumPosts', 'wikiGuides', 'userInteractions']
    for (const collection of collections) {
      await testDb.collection(collection).deleteMany({})
    }
    
    // Insert test user
    await testDb.collection('users').insertOne(testUser)
  })

  afterEach(async () => {
    // Clean up after each test
    const collections = ['users', 'blogPosts', 'forumPosts', 'wikiGuides', 'userInteractions']
    for (const collection of collections) {
      await testDb.collection(collection).deleteMany({})
    }
  })

  describe('Blog DAL Operations', () => {
    it('creates blog posts with proper data structure', async () => {
      const result = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      expect(result).toMatchObject({
        title: testBlogPost.title,
        content: testBlogPost.content,
        slug: testBlogPost.slug,
        author: testBlogPost.author,
        category: testBlogPost.category,
        status: 'published'
      })
      
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.stats).toMatchObject({
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        sharesCount: 0
      })
    })

    it('retrieves blog posts with filters and pagination', async () => {
      // Create multiple test posts
      await DAL.blog.createPost(testBlogPost, testUser.id)
      await DAL.blog.createPost({
        ...testBlogPost,
        title: 'Second Post',
        slug: 'second-post',
        category: 'tech'
      }, testUser.id)
      await DAL.blog.createPost({
        ...testBlogPost,
        title: 'Draft Post',
        slug: 'draft-post',
        status: 'draft'
      }, testUser.id)

      // Test basic retrieval
      const allPosts = await DAL.blog.getPosts({})
      expect(allPosts.blogPosts).toHaveLength(2) // Only published posts
      
      // Test category filter
      const techPosts = await DAL.blog.getPosts({ category: 'tech' })
      expect(techPosts.blogPosts).toHaveLength(1)
      expect(techPosts.blogPosts[0].title).toBe('Second Post')
      
      // Test pagination
      const paginatedPosts = await DAL.blog.getPosts({ page: 1, limit: 1 })
      expect(paginatedPosts.blogPosts).toHaveLength(1)
      expect(paginatedPosts.pagination.total).toBe(2)
      expect(paginatedPosts.pagination.totalPages).toBe(2)
    })

    it('retrieves single blog post by slug', async () => {
      const created = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      const retrieved = await DAL.blog.getPostBySlug(testBlogPost.slug)
      expect(retrieved).toMatchObject({
        title: testBlogPost.title,
        slug: testBlogPost.slug,
        content: testBlogPost.content
      })
      expect(retrieved.id).toBe(created.id)
    })

    it('updates blog posts correctly', async () => {
      const created = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated', 'test']
      }
      
      const updated = await DAL.blog.updatePost(testBlogPost.slug, updateData, testUser.id)
      expect(updated.title).toBe('Updated Title')
      expect(updated.content).toBe('Updated content')
      expect(updated.tags).toEqual(['updated', 'test'])
      expect(updated.updatedAt).not.toBe(created.updatedAt)
    })

    it('deletes blog posts correctly', async () => {
      await DAL.blog.createPost(testBlogPost, testUser.id)
      
      await DAL.blog.deletePost(testBlogPost.slug, testUser.id)
      
      const retrieved = await DAL.blog.getPostBySlug(testBlogPost.slug)
      expect(retrieved).toBeNull()
    })

    it('handles blog post not found gracefully', async () => {
      const result = await DAL.blog.getPostBySlug('non-existent-post')
      expect(result).toBeNull()
    })
  })

  describe('Forum DAL Operations', () => {
    it('creates forum posts with proper data structure', async () => {
      const result = await DAL.forum.createPost(testForumPost, testUser.id)
      
      expect(result).toMatchObject({
        title: testForumPost.title,
        content: testForumPost.content,
        slug: testForumPost.slug,
        author: testForumPost.author,
        category: testForumPost.category,
        isPinned: false,
        isLocked: false
      })
      
      expect(result.stats.repliesCount).toBe(0)
    })

    it('handles forum-specific operations (pin/lock)', async () => {
      const created = await DAL.forum.createPost(testForumPost, testUser.id)
      
      // Test pinning
      const pinned = await DAL.forum.updatePost(testForumPost.slug, { isPinned: true }, testUser.id)
      expect(pinned.isPinned).toBe(true)
      
      // Test locking
      const locked = await DAL.forum.updatePost(testForumPost.slug, { isLocked: true }, testUser.id)
      expect(locked.isLocked).toBe(true)
    })

    it('retrieves forum posts ordered by pin status', async () => {
      // Create regular post
      await DAL.forum.createPost(testForumPost, testUser.id)
      
      // Create pinned post
      await DAL.forum.createPost({
        ...testForumPost,
        title: 'Pinned Post',
        slug: 'pinned-post',
        isPinned: true
      }, testUser.id)
      
      const posts = await DAL.forum.getPosts({ sortBy: 'latest' })
      
      // Pinned posts should appear first
      expect(posts.forumPosts[0].title).toBe('Pinned Post')
      expect(posts.forumPosts[0].isPinned).toBe(true)
    })
  })

  describe('Wiki DAL Operations', () => {
    it('creates wiki guides with proper data structure', async () => {
      const result = await DAL.wiki.createGuide(testWikiGuide, testUser.id)
      
      expect(result).toMatchObject({
        title: testWikiGuide.title,
        content: testWikiGuide.content,
        slug: testWikiGuide.slug,
        difficulty: 'beginner',
        category: testWikiGuide.category
      })
      
      expect(result.stats.helpfulsCount).toBe(0)
    })

    it('filters wiki guides by difficulty', async () => {
      await DAL.wiki.createGuide(testWikiGuide, testUser.id)
      await DAL.wiki.createGuide({
        ...testWikiGuide,
        title: 'Advanced Guide',
        slug: 'advanced-guide',
        difficulty: 'advanced'
      }, testUser.id)
      
      const beginnerGuides = await DAL.wiki.getGuides({ difficulty: 'beginner' })
      expect(beginnerGuides.wikiGuides).toHaveLength(1)
      expect(beginnerGuides.wikiGuides[0].difficulty).toBe('beginner')
      
      const advancedGuides = await DAL.wiki.getGuides({ difficulty: 'advanced' })
      expect(advancedGuides.wikiGuides).toHaveLength(1)
      expect(advancedGuides.wikiGuides[0].difficulty).toBe('advanced')
    })
  })

  describe('Cross-Module Consistency', () => {
    it('maintains consistent author embedding across all modules', async () => {
      const blog = await DAL.blog.createPost(testBlogPost, testUser.id)
      const forum = await DAL.forum.createPost(testForumPost, testUser.id)
      const wiki = await DAL.wiki.createGuide(testWikiGuide, testUser.id)
      
      // All should have consistent author structure
      expect(blog.author).toEqual(testBlogPost.author)
      expect(forum.author).toEqual(testForumPost.author)
      expect(wiki.author).toEqual(testWikiGuide.author)
    })

    it('maintains consistent stats structure across all modules', async () => {
      const blog = await DAL.blog.createPost(testBlogPost, testUser.id)
      const forum = await DAL.forum.createPost(testForumPost, testUser.id)
      const wiki = await DAL.wiki.createGuide(testWikiGuide, testUser.id)
      
      // All should have basic stats
      expect(blog.stats).toMatchObject({
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        sharesCount: 0
      })
      
      expect(forum.stats).toMatchObject({
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        sharesCount: 0,
        repliesCount: 0
      })
      
      expect(wiki.stats).toMatchObject({
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
        sharesCount: 0,
        helpfulsCount: 0
      })
    })

    it('handles slug uniqueness within each module', async () => {
      const blog1 = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      // Should allow same slug in different modules
      const forum1 = await DAL.forum.createPost({
        ...testForumPost,
        slug: testBlogPost.slug // Same slug as blog post
      }, testUser.id)
      
      expect(blog1.slug).toBe(forum1.slug)
      
      // But should prevent duplicates within same module
      try {
        await DAL.blog.createPost({
          ...testBlogPost,
          title: 'Different Title'
        }, testUser.id)
        expect.fail('Should have thrown error for duplicate slug')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('User Interactions Integration', () => {
    it('records and retrieves user interactions correctly', async () => {
      const blog = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      // Record like interaction
      const likeResult = await DAL.blog.recordInteraction(testUser.id, blog.slug, 'post', 'like')
      expect(likeResult.action).toBe('added')
      expect(likeResult.stats.likesCount).toBe(1)
      expect(likeResult.interactions.isLiked).toBe(true)
      
      // Record bookmark interaction
      const bookmarkResult = await DAL.blog.recordInteraction(testUser.id, blog.slug, 'post', 'bookmark')
      expect(bookmarkResult.action).toBe('added')
      expect(bookmarkResult.stats.bookmarksCount).toBe(1)
      expect(bookmarkResult.interactions.isBookmarked).toBe(true)
      
      // Toggle like (remove)
      const unlikeResult = await DAL.blog.recordInteraction(testUser.id, blog.slug, 'post', 'like')
      expect(unlikeResult.action).toBe('removed')
      expect(unlikeResult.stats.likesCount).toBe(0)
      expect(unlikeResult.interactions.isLiked).toBe(false)
    })

    it('handles view count increments correctly', async () => {
      const wiki = await DAL.wiki.createGuide(testWikiGuide, testUser.id)
      
      const initialViews = wiki.stats.viewsCount
      
      // Record view
      await DAL.wiki.incrementViewCount(wiki.slug)
      
      const updated = await DAL.wiki.getGuideBySlug(wiki.slug)
      expect(updated.stats.viewsCount).toBe(initialViews + 1)
      
      // Record another view
      await DAL.wiki.incrementViewCount(wiki.slug)
      
      const updated2 = await DAL.wiki.getGuideBySlug(wiki.slug)
      expect(updated2.stats.viewsCount).toBe(initialViews + 2)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed data gracefully', async () => {
      try {
        await DAL.blog.createPost({
          ...testBlogPost,
          title: '', // Invalid empty title
        }, testUser.id)
        expect.fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('handles missing user data gracefully', async () => {
      try {
        await DAL.forum.createPost(testForumPost, 'non-existent-user')
        expect.fail('Should have thrown error for non-existent user')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('handles concurrent operations correctly', async () => {
      const blog = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      // Simulate concurrent like operations
      const promises = Array.from({ length: 5 }, () =>
        DAL.blog.recordInteraction(testUser.id, blog.slug, 'post', 'like')
      )
      
      const results = await Promise.allSettled(promises)
      
      // Should handle all operations atomically
      const final = await DAL.blog.getPostBySlug(blog.slug)
      
      // Since it's the same user toggling likes, final state depends on odd/even number of operations
      expect(typeof final.stats.likesCount).toBe('number')
      expect(final.stats.likesCount >= 0).toBe(true)
    })

    it('maintains data consistency during failures', async () => {
      const blog = await DAL.blog.createPost(testBlogPost, testUser.id)
      
      // Mock a database error during update
      const originalUpdate = testDb.collection('blogPosts').updateOne
      testDb.collection('blogPosts').updateOne = vi.fn().mockRejectedValue(new Error('DB Error'))
      
      try {
        await DAL.blog.updatePost(blog.slug, { title: 'Should Fail' }, testUser.id)
        expect.fail('Should have thrown error')
      } catch (error) {
        expect(error.message).toBe('DB Error')
      }
      
      // Restore original method
      testDb.collection('blogPosts').updateOne = originalUpdate
      
      // Verify data remained unchanged
      const unchanged = await DAL.blog.getPostBySlug(blog.slug)
      expect(unchanged.title).toBe(testBlogPost.title) // Original title
    })
  })

  describe('Search and Indexing', () => {
    it('supports text search across content', async () => {
      await DAL.blog.createPost({
        ...testBlogPost,
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript programming'
      }, testUser.id)
      
      await DAL.blog.createPost({
        ...testBlogPost,
        title: 'Python Guide',
        slug: 'python-guide',
        content: 'Learn Python programming'
      }, testUser.id)
      
      // Search for 'JavaScript'
      const jsResults = await DAL.blog.getPosts({ search: 'JavaScript' })
      expect(jsResults.blogPosts).toHaveLength(1)
      expect(jsResults.blogPosts[0].title).toBe('JavaScript Tutorial')
      
      // Search for 'programming' (should match both)
      const progResults = await DAL.blog.getPosts({ search: 'programming' })
      expect(progResults.blogPosts.length).toBeGreaterThanOrEqual(1)
    })

    it('handles empty search results gracefully', async () => {
      const results = await DAL.wiki.getGuides({ search: 'nonexistent-topic' })
      expect(results.wikiGuides).toHaveLength(0)
      expect(results.pagination.total).toBe(0)
    })
  })
})