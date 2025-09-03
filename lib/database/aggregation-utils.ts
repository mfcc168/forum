/**
 * Database Aggregation Utilities
 * 
 * Provides reusable aggregation pipeline components to reduce complexity
 */

import { ObjectId } from 'mongodb'

/**
 * Creates a stage to safely convert author field to ObjectId
 * Handles both legacy ObjectId format and new embedded author format
 */
export function createAuthorConversionStage() {
  return {
    $addFields: {
      authorObjectId: {
        $switch: {
          branches: [
            {
              case: { $eq: [{ $type: '$author' }, 'objectId'] },
              then: '$author'
            },
            {
              case: { $eq: [{ $type: '$author' }, 'string'] },
              then: { $toObjectId: '$author' }
            },
            {
              case: { $eq: [{ $type: '$author' }, 'object'] },
              then: {
                $cond: {
                  if: '$author.id',
                  then: { $toObjectId: '$author.id' },
                  else: { $toObjectId: '$author._id' }
                }
              }
            }
          ],
          default: null
        }
      }
    }
  }
}

/**
 * Creates a lookup stage for author details
 */
export function createAuthorLookupStage() {
  return {
    $lookup: {
      from: 'users',
      localField: 'authorObjectId',
      foreignField: '_id',
      as: 'authorDetails',
      pipeline: [
        {
          $project: {
            _id: 1,
            username: 1,
            'profile.displayName': 1,
            'profile.avatar': 1,
            email: 1
          }
        }
      ]
    }
  }
}

/**
 * Creates a stage to transform author data to consistent format
 */
export function createAuthorTransformStage() {
  return {
    $addFields: {
      id: { $toString: '$_id' },
      author: {
        $cond: {
          if: { 
            $and: [
              { $eq: [{ $type: '$author' }, 'object'] },
              { $ne: ['$author', null] }
            ]
          },
          then: '$author', // Use existing embedded author (already has id, name, avatar)
          else: {
            // Transform from lookup result
            $let: {
              vars: { authorData: { $arrayElemAt: ['$authorDetails', 0] } },
              in: {
                $cond: {
                  if: '$$authorData',
                  then: {
                    id: { $toString: '$$authorData._id' },
                    name: { 
                      $ifNull: [
                        '$$authorData.profile.displayName', 
                        { $ifNull: ['$$authorData.username', '$$authorData.email', 'Unknown User'] }
                      ] 
                    },
                    avatar: { $ifNull: ['$$authorData.profile.avatar', null] }
                  },
                  else: {
                    id: { $toString: '$authorObjectId' },
                    name: 'Unknown User',
                    avatar: null
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Creates user interactions lookup stage for any content type
 */
export function createUserInteractionsStage(userId?: string, targetType: string = 'post') {
  if (!userId) return []
  
  return [
    {
      $lookup: {
        from: 'userInteractions',
        let: { 
          contentId: '$_id',
          contentIdStr: { $toString: '$_id' }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { 
                    $or: [
                      { $eq: ['$targetId', '$$contentId'] },
                      { $eq: ['$targetId', '$$contentIdStr'] }
                    ]
                  },
                  { $eq: ['$userId', userId] },
                  { $eq: ['$targetType', targetType] }
                ]
              }
            }
          },
          { $project: { interactionType: 1 } }
        ],
        as: 'userInteractions'
      }
    },
    {
      $addFields: {
        interactions: {
          isLiked: { $in: ['like', '$userInteractions.interactionType'] },
          isBookmarked: { $in: ['bookmark', '$userInteractions.interactionType'] },
          isShared: { $in: ['share', '$userInteractions.interactionType'] },
          // Wiki-specific interaction
          isHelpful: { $in: ['helpful', '$userInteractions.interactionType'] }
        }
      }
    }
  ]
}

/**
 * Creates user interactions lookup stage for blog posts
 */
export function createBlogUserInteractionsStage(userId?: string) {
  if (!userId) return []
  
  return [
    {
      $lookup: {
        from: 'userInteractions',
        let: { 
          postId: '$_id',
          postIdStr: { $toString: '$_id' }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { 
                    $or: [
                      { $eq: ['$targetId', '$$postId'] },
                      { $eq: ['$targetId', '$$postIdStr'] }
                    ]
                  },
                  { $eq: ['$userId', userId] },
                  { $eq: ['$targetType', 'post'] }
                ]
              }
            }
          },
          { $project: { interactionType: 1 } }
        ],
        as: 'userInteractions'
      }
    },
    {
      $addFields: {
        interactions: {
          isLiked: { $in: ['like', '$userInteractions.interactionType'] },
          isBookmarked: { $in: ['bookmark', '$userInteractions.interactionType'] },
          isShared: { $in: ['share', '$userInteractions.interactionType'] }
        }
      }
    }
  ]
}

/**
 * Creates user interactions lookup stage for wiki guides
 */
export function createWikiUserInteractionsStage(userId?: string) {
  if (!userId) return []
  
  return [
    {
      $lookup: {
        from: 'userInteractions',
        let: { 
          guideId: '$_id',
          guideIdStr: { $toString: '$_id' }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { 
                    $or: [
                      { $eq: ['$targetId', '$$guideId'] },
                      { $eq: ['$targetId', '$$guideIdStr'] }
                    ]
                  },
                  { $eq: ['$userId', userId] },
                  { $eq: ['$targetType', 'guide'] }
                ]
              }
            }
          },
          { $project: { interactionType: 1 } }
        ],
        as: 'userInteractions'
      }
    },
    {
      $addFields: {
        interactions: {
          isLiked: { $in: ['like', '$userInteractions.interactionType'] },
          isBookmarked: { $in: ['bookmark', '$userInteractions.interactionType'] },
          isHelpful: { $in: ['helpful', '$userInteractions.interactionType'] }
        }
      }
    }
  ]
}

/**
 * Creates a cleanup stage to remove temporary fields
 */
export function createCleanupStage() {
  return {
    $project: {
      authorObjectId: 0,
      authorDetails: 0,
      userInteractions: 0
    }
  }
}

/**
 * Creates a complete posts aggregation pipeline
 */
export function createPostsAggregationPipeline(
  filter: object,
  sort: object,
  skip: number,
  limit: number,
  userId?: string
) {
  const pipeline = [
    { $match: filter },
    createAuthorConversionStage(),
    { $match: { authorObjectId: { $ne: null } } }, // Filter out invalid authors
    createAuthorLookupStage(),
    createAuthorTransformStage(),
    ...createUserInteractionsStage(userId),
    createCleanupStage(),
    { $sort: sort },
    { $skip: skip },
    { $limit: limit }
  ]
  
  return pipeline
}

/**
 * Creates a complete blog posts aggregation pipeline
 */
export function createBlogPostsAggregationPipeline(
  filter: object,
  sort: object,
  skip: number,
  limit: number,
  userId?: string
) {
  const pipeline = [
    { $match: filter },
    createAuthorConversionStage(),
    { $match: { authorObjectId: { $ne: null } } },
    createAuthorLookupStage(),
    createAuthorTransformStage(),
    ...createBlogUserInteractionsStage(userId),
    createCleanupStage(),
    { $sort: sort },
    { $skip: skip },
    { $limit: limit }
  ]
  
  return pipeline
}

/**
 * Creates a complete wiki guides aggregation pipeline
 */
export function createWikiGuidesAggregationPipeline(
  filter: object,
  sort: object,
  skip: number,
  limit: number,
  userId?: string
) {
  const pipeline = [
    { $match: filter },
    createAuthorConversionStage(),
    { $match: { authorObjectId: { $ne: null } } },
    createAuthorLookupStage(),
    createAuthorTransformStage(),
    ...createWikiUserInteractionsStage(userId),
    createCleanupStage(),
    { $sort: sort },
    { $skip: skip },
    { $limit: limit }
  ]
  
  return pipeline
}

/**
 * Creates a single blog post aggregation pipeline
 */
export function createSingleBlogPostPipeline(
  matchStage: object,
  userId?: string
) {
  const pipeline = [
    { $match: matchStage },
    createAuthorConversionStage(),
    { $match: { authorObjectId: { $ne: null } } },
    createAuthorLookupStage(),
    createAuthorTransformStage(),
    ...createBlogUserInteractionsStage(userId),
    createCleanupStage()
  ]
  
  return pipeline
}

/**
 * Creates a single wiki guide aggregation pipeline
 */
export function createSingleWikiGuidePipeline(
  matchStage: object,
  userId?: string
) {
  const pipeline = [
    { $match: matchStage },
    createAuthorConversionStage(),
    { $match: { authorObjectId: { $ne: null } } },
    createAuthorLookupStage(),
    createAuthorTransformStage(),
    ...createWikiUserInteractionsStage(userId),
    createCleanupStage()
  ]
  
  return pipeline
}

/**
 * Creates a single forum post aggregation pipeline
 */
export function createSingleForumPostPipeline(
  matchStage: object,
  userId?: string
) {
  const pipeline = [
    { $match: matchStage },
    createAuthorConversionStage(),
    { $match: { authorObjectId: { $ne: null } } },
    createAuthorLookupStage(),
    createAuthorTransformStage(),
    ...createUserInteractionsStage(userId),
    createCleanupStage()
  ]
  
  return pipeline
}

