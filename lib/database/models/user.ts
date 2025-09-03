import { ObjectId } from 'mongodb'
import { BaseDocument } from './base'

// =============================================
// USER MODEL - Enhanced with profile and permissions
// =============================================

export interface UserProfile {
  username: string                 // ✅ Required unique username
  displayName?: string             // ✅ Optional display name
  bio?: string
  avatar?: string
  website?: string
  location?: string
  socialLinks?: {
    discord?: string
    twitter?: string
    github?: string
  }
  minecraft?: {
    username?: string
    uuid?: string
    skinUrl?: string
    joinedServerAt?: Date          // ✅ Standardized timestamp naming
    lastSeenAt?: Date              // ✅ Standardized timestamp naming
    playtimeMinutes: number        // ✅ Clear unit specification
  }
}

export interface UserStats {
  postsCount: number             // ✅ Consistent 'Count' suffix
  repliesCount: number           // ✅ Consistent 'Count' suffix
  likesReceived: number
  likesGiven: number
  reputation: number
  experiencePoints: number
  level: number
  
  // Time-based engagement metrics
  last30daysPostsCount: number   // ✅ Clear time period naming
  last30daysRepliesCount: number // ✅ Clear time period naming
  last30daysLikesReceived: number
  averageResponseTimeMinutes: number  // ✅ Clear unit specification
  contributionScore: number           // Composite score based on quality of contributions
  totalMinutesActive: number          // ✅ Clear unit specification
  
  // Achievement tracking
  achievements: {
    name: string
    earnedAt: Date               // ✅ Consistent timestamp naming
    progress?: number
  }[]
}

export interface UserPreferences {
  language: 'en' | 'zh-TW'
  theme: 'light' | 'dark' | 'auto'
  
  notifications: {
    isEmailEnabled: boolean      // ✅ Consistent boolean naming
    isPushEnabled: boolean       // ✅ Consistent boolean naming
    isMentionsEnabled: boolean   // ✅ Consistent boolean naming
    isRepliesEnabled: boolean    // ✅ Consistent boolean naming
    isNewslettersEnabled: boolean // ✅ Consistent boolean naming
    isModerationEnabled: boolean  // ✅ Consistent boolean naming
  }
  
  privacy: {
    isEmailVisible: boolean       // ✅ Consistent boolean naming
    isLastSeenVisible: boolean    // ✅ Consistent boolean naming
    isOnlineStatusVisible: boolean // ✅ Consistent boolean naming
  }
}

export interface User extends BaseDocument {
  // Authentication
  email: string
  isEmailVerified: boolean         // ✅ Consistent boolean naming
  providers: {
    discord?: {
      id: string
      username: string
      discriminator?: string
      avatar?: string
    }
    google?: {
      id: string
      email: string
    }
    // Future providers can be added here
  }
  
  // Profile
  profile: UserProfile
  
  // Role and permissions
  role: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
  permissions: string[]            // e.g., ['forum.moderate', 'blog.write']
  
  // Activity tracking
  lastActiveAt: Date              // ✅ Consistent timestamp naming
  isOnline: boolean               // ✅ Consistent boolean naming
  
  // Stats and gamification
  stats: UserStats
  
  // User preferences
  preferences: UserPreferences
  
  // Status
  status: 'active' | 'suspended' | 'banned'
  statusReason?: string
  statusExpiresAt?: Date          // ✅ Consistent timestamp naming
  
  // Indexes: email(unique), role, lastActiveAt, status, isDeleted
}

// Embedded user reference to avoid N+1 queries
export interface UserRef {
  _id: ObjectId
  username: string
  displayName?: string
  avatar?: string
  role: User['role']
  level: number
}

// User interactions for tracking likes, views, bookmarks, etc.
export interface UserInteraction extends BaseDocument {
  userId: ObjectId
  targetType: 'post' | 'reply' | 'comment' | 'user'
  targetId: ObjectId
  interactionType: 'like' | 'dislike' | 'bookmark' | 'share' | 'report' | 'follow' | 'view'
  
  // Metadata based on interaction type
  metadata?: {
    // For reports
    reason?: string
    description?: string
    
    // For shares
    platform?: 'twitter' | 'discord' | 'facebook' | 'link'
    
    // For views
    durationSeconds?: number       // ✅ Clear unit specification
    referrer?: string
    
    // For bookmarks
    collectionName?: string
    tags?: string[]
  }
  
  // Analytics and fraud detection
  ipAddress?: string
  userAgent?: string
  
  // Indexes: userId + targetType + targetId(unique), targetId + interactionType, createdAt
}