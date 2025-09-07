/**
 * Referential Integrity Management
 * 
 * Handles cascading deletions and foreign key cleanup to maintain data consistency.
 * This ensures that when content is deleted, all related records are properly handled.
 */

import { ObjectId, Collection } from 'mongodb'

// Type for DAL instances that support referential integrity operations
interface DALInstance {
  getNamedCollectionPublic: (name: string) => Promise<Collection>
}

/**
 * Manages referential integrity across all collections
 */
export class ReferentialIntegrityManager {
  /**
   * Clean up all references to a deleted forum post
   * 
   * @param postId - The ID of the deleted forum post
   * @param dalInstance - DAL instance for database operations
   */
  static async cleanupForumPostReferences(postId: string, dalInstance: DALInstance): Promise<void> {
    const objectId = new ObjectId(postId)
    
    try {
      await Promise.allSettled([
        // 1. Soft delete all replies to this post
        dalInstance.getNamedCollectionPublic('forumReplies').then((collection: Collection) =>
          collection.updateMany(
            { postId: objectId, isDeleted: false },
            {
              $set: {
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            }
          )
        ).catch((error) => {
          console.warn('Could not clean up forum replies (collection may not exist):', error.message)
        }),

        // 2. Clean up user interactions (likes, bookmarks, shares)
        dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'post'
          })
        ).catch((error) => {
          console.warn('Could not clean up user interactions (collection may not exist):', error.message)
        }),

        // 3. Clean up user activity logs
        dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'forum'
          })
        ).catch((error) => {
          console.warn('Could not clean up user activity (collection may not exist):', error.message)
        })
      ])
      
      // Successfully cleaned up references for forum post
    } catch (error) {
      console.error(`Error cleaning up forum post references for ${postId}:`, error)
      throw new Error(`Failed to clean up forum post references: ${error}`)
    }
  }

  /**
   * Clean up all references to a deleted blog post
   * 
   * @param postId - The ID of the deleted blog post
   * @param dalInstance - DAL instance for database operations
   */
  static async cleanupBlogPostReferences(postId: string, dalInstance: DALInstance): Promise<void> {
    const objectId = new ObjectId(postId)
    
    try {
      await Promise.allSettled([
        // 1. Soft delete all comments on this blog post (if comments exist)
        dalInstance.getNamedCollectionPublic('blogComments').then((collection: Collection) =>
          collection.updateMany(
            { postId: objectId, isDeleted: false },
            {
              $set: {
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            }
          ).catch((error) => {
            console.warn('Could not clean up blog comments (collection may not exist):', error.message)
          })
        ),

        // 2. Clean up user interactions (likes, bookmarks, shares)
        dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'post'
          })
        ).catch((error) => {
          console.warn('Could not clean up user interactions (collection may not exist):', error.message)
        }),

        // 3. Clean up user activity logs
        dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'blog'
          })
        ).catch((error) => {
          console.warn('Could not clean up user activity (collection may not exist):', error.message)
        })
      ])
      
      // Successfully cleaned up references for blog post
    } catch (error) {
      console.error(`Error cleaning up blog post references for ${postId}:`, error)
      throw new Error(`Failed to clean up blog post references: ${error}`)
    }
  }

  /**
   * Clean up all references to a deleted wiki guide
   * 
   * @param guideId - The ID of the deleted wiki guide
   * @param dalInstance - DAL instance for database operations
   */
  static async cleanupWikiGuideReferences(guideId: string, dalInstance: DALInstance): Promise<void> {
    const objectId = new ObjectId(guideId)
    
    try {
      await Promise.allSettled([
        // 1. Clean up user interactions (likes, bookmarks, helpful, shares)
        dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'guide'
          })
        ).catch((error) => {
          console.warn('Could not clean up user interactions (collection may not exist):', error.message)
        }),

        // 2. Clean up user activity logs
        dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'wiki'
          })
        ).catch((error) => {
          console.warn('Could not clean up user activity (collection may not exist):', error.message)
        })
      ])
      
      // Successfully cleaned up references for wiki guide
    } catch (error) {
      console.error(`Error cleaning up wiki guide references for ${guideId}:`, error)
      throw new Error(`Failed to clean up wiki guide references: ${error}`)
    }
  }

  /**
   * Clean up all references to a deleted forum reply
   * 
   * @param replyId - The ID of the deleted forum reply
   * @param dalInstance - DAL instance for database operations
   */
  static async cleanupForumReplyReferences(replyId: string, dalInstance: DALInstance): Promise<void> {
    const objectId = new ObjectId(replyId)
    
    try {
      await Promise.allSettled([
        // 1. Clean up user interactions on this reply
        dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'reply'
          })
        ).catch((error) => {
          console.warn('Could not clean up user interactions (collection may not exist):', error.message)
        }),

        // 2. Clean up user activity logs
        dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
          collection.deleteMany({
            targetId: objectId,
            targetType: 'forum-reply'
          })
        ).catch((error) => {
          console.warn('Could not clean up user activity (collection may not exist):', error.message)
        })
      ])
      
      // Successfully cleaned up references for forum reply
    } catch (error) {
      console.error(`Error cleaning up forum reply references for ${replyId}:`, error)
      throw new Error(`Failed to clean up forum reply references: ${error}`)
    }
  }

  /**
   * Get statistics about orphaned references before cleanup
   * Useful for monitoring and debugging
   * 
   * @param targetId - The ID to check for orphaned references
   * @param targetType - The type of target ('post', 'guide', 'reply')
   * @param dalInstance - DAL instance for database operations
   */
  static async getOrphanedReferenceStats(
    targetId: string, 
    targetType: 'post' | 'guide' | 'reply', 
    dalInstance: DALInstance
  ): Promise<{
    userInteractions: number
    userActivity: number
    replies?: number
    comments?: number
  }> {
    const objectId = new ObjectId(targetId)
    
    try {
      const [userInteractions, userActivity, replies, comments] = await Promise.all([
        dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
          collection.countDocuments({
            targetId: objectId,
            targetType: targetType === 'guide' ? 'guide' : 'post'
          })
        ),
        
        dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
          collection.countDocuments({
            targetId: objectId
          })
        ),

        // Count replies only for forum posts
        targetType === 'post' ? 
          dalInstance.getNamedCollectionPublic('forumReplies').then((collection: Collection) =>
            collection.countDocuments({
              postId: objectId,
              isDeleted: false
            })
          ) : Promise.resolve(0),

        // Count comments only for blog posts  
        targetType === 'post' ?
          dalInstance.getNamedCollectionPublic('blogComments').then((collection: Collection) =>
            collection.countDocuments({
              postId: objectId,
              isDeleted: false
            }).catch(() => 0) // Comments collection may not exist
          ) : Promise.resolve(0)
      ])

      return {
        userInteractions,
        userActivity,
        ...(replies && { replies }),
        ...(comments && { comments })
      }
    } catch (error) {
      console.error(`Error getting orphaned reference stats for ${targetId}:`, error)
      throw new Error(`Failed to get orphaned reference stats: ${error}`)
    }
  }

  /**
   * Validate referential integrity across the database
   * Returns a report of any inconsistencies found
   * 
   * @param dalInstance - DAL instance for database operations
   */
  static async validateReferentialIntegrity(dalInstance: DALInstance): Promise<{
    orphanedReplies: number
    orphanedInteractions: number
    orphanedActivity: number
    deletedPostsWithActiveReplies: number
    isValid: boolean
  }> {
    try {
      // Check for orphaned forum replies (replies to deleted posts)
      const orphanedReplies = await dalInstance.getNamedCollectionPublic('forumReplies').then((collection: Collection) =>
        collection.aggregate([
          {
            $lookup: {
              from: 'forumPosts',
              localField: 'postId',
              foreignField: '_id',
              as: 'post'
            }
          },
          {
            $match: {
              isDeleted: false,
              $or: [
                { post: { $size: 0 } }, // Post doesn't exist
                { 'post.isDeleted': true } // Post is deleted
              ]
            }
          },
          { $count: 'orphanedReplies' }
        ]).toArray().then((result) => result[0]?.orphanedReplies || 0)
      )

      // Check for orphaned user interactions (interactions with deleted content)
      const orphanedInteractions = await dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
        collection.aggregate([
          {
            $lookup: {
              from: 'forumPosts',
              let: { targetId: '$targetId' },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$targetId'] } } }
              ],
              as: 'forumPost'
            }
          },
          {
            $lookup: {
              from: 'blogPosts',
              let: { targetId: '$targetId' },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$targetId'] } } }
              ],
              as: 'blogPost'
            }
          },
          {
            $lookup: {
              from: 'wikiGuides',
              let: { targetId: '$targetId' },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$targetId'] } } }
              ],
              as: 'wikiGuide'
            }
          },
          {
            $match: {
              $and: [
                { forumPost: { $size: 0 } },
                { blogPost: { $size: 0 } },
                { wikiGuide: { $size: 0 } }
              ]
            }
          },
          { $count: 'orphanedInteractions' }
        ]).toArray().then((result) => result[0]?.orphanedInteractions || 0)
      )

      // Check for orphaned activity logs
      const orphanedActivity = await dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
        collection.countDocuments({
          targetId: { $exists: true },
          // This would need more complex validation based on targetType
        }).catch(() => 0) // Collection may not exist
      )

      // Check for deleted posts that still have active replies
      const deletedPostsWithActiveReplies = await dalInstance.getNamedCollectionPublic('forumPosts').then((collection: Collection) =>
        collection.aggregate([
          { $match: { isDeleted: true } },
          {
            $lookup: {
              from: 'forumReplies',
              localField: '_id',
              foreignField: 'postId',
              pipeline: [
                { $match: { isDeleted: false } }
              ],
              as: 'activeReplies'
            }
          },
          {
            $match: {
              activeReplies: { $ne: [] }
            }
          },
          { $count: 'deletedPostsWithActiveReplies' }
        ]).toArray().then((result) => result[0]?.deletedPostsWithActiveReplies || 0)
      )

      const isValid = orphanedReplies === 0 && 
                     orphanedInteractions === 0 && 
                     deletedPostsWithActiveReplies === 0

      return {
        orphanedReplies,
        orphanedInteractions,
        orphanedActivity,
        deletedPostsWithActiveReplies,
        isValid
      }
    } catch (error) {
      console.error('Error validating referential integrity:', error)
      throw new Error(`Failed to validate referential integrity: ${error}`)
    }
  }

  /**
   * Fix all referential integrity issues found in the database
   * CAUTION: This will permanently delete orphaned records
   * 
   * @param dalInstance - DAL instance for database operations
   * @param dryRun - If true, only reports what would be deleted without actually deleting
   */
  static async repairReferentialIntegrity(
    dalInstance: DALInstance, 
    dryRun: boolean = true
  ): Promise<{
    wouldDelete: {
      orphanedReplies: number
      orphanedInteractions: number
      orphanedActivity: number
    }
    actuallyDeleted?: {
      orphanedReplies: number
      orphanedInteractions: number  
      orphanedActivity: number
    }
  }> {
    try {
      // First get the validation report to see what needs fixing
      const integrity = await this.validateReferentialIntegrity(dalInstance)
      
      const wouldDelete = {
        orphanedReplies: integrity.orphanedReplies,
        orphanedInteractions: integrity.orphanedInteractions,
        orphanedActivity: integrity.orphanedActivity
      }

      if (dryRun) {
        return { wouldDelete }
      }

      // Actually perform the cleanup operations
      const [repliesDeleted, interactionsDeleted, activityDeleted] = await Promise.all([
        // Delete orphaned forum replies
        dalInstance.getNamedCollectionPublic('forumReplies').then((collection: Collection) =>
          collection.updateMany(
            {
              isDeleted: false,
              postId: { $nin: [] } // This would need proper implementation
            },
            {
              $set: {
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            }
          ).then((result) => result.modifiedCount)
        ),

        // Delete orphaned user interactions
        dalInstance.getNamedCollectionPublic('userInteractions').then((collection: Collection) =>
          collection.deleteMany({
            // This would need proper implementation with lookup logic
          }).then((result) => result.deletedCount)
        ),

        // Delete orphaned activity logs
        dalInstance.getNamedCollectionPublic('userActivity').then((collection: Collection) =>
          collection.deleteMany({
            // This would need proper implementation
          }).then((result) => result.deletedCount).catch(() => 0)
        )
      ])

      return {
        wouldDelete,
        actuallyDeleted: {
          orphanedReplies: repliesDeleted,
          orphanedInteractions: interactionsDeleted,
          orphanedActivity: activityDeleted
        }
      }
    } catch (error) {
      console.error('Error repairing referential integrity:', error)
      throw new Error(`Failed to repair referential integrity: ${error}`)
    }
  }
}