/**
 * User System Definitions
 * 
 * User entities with flattened structure for better accessibility
 */

import type { Entity } from './base'

// ============================================================================
// USER SUB-INTERFACES (for better type composition)
// ============================================================================

/** User profile information */
export interface UserProfile {
  bio?: string
  location?: string
  website?: string
  minecraftUsername?: string
  minecraftUuid?: string
  minecraftJoinedAt?: string
}

/** User activity statistics */
export interface UserStats {
  postsCount: number
  repliesCount: number
  likesCount: number
  reputation: number
  level: number
}

/** User preferences and settings */
export interface UserPreferences {
  language: 'en' | 'zh-TW'
  theme: 'light' | 'dark' | 'auto'
  emailNotifications: boolean
  pushNotifications: boolean
  mentionNotifications: boolean
  replyNotifications: boolean
}

/** External auth provider info */
export interface AuthProviders {
  discord?: {
    id: string
    username: string
    discriminator: string
  }
  google?: {
    id: string
    email: string
  }
}

/** Main user entity with flattened structure */
export interface User extends Entity {
  // Core identity
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'moderator' | 'vip' | 'member' | 'banned'
  status: 'active' | 'suspended' | 'banned'
  lastActiveAt: string
  
  // Composed sub-objects (well-defined interfaces)
  profile: UserProfile
  stats: UserStats
  preferences: UserPreferences
  providers: AuthProviders
}

/** Auth user type - essential fields from main User interface */
export type AuthUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'createdAt' | 'lastActiveAt' | 'avatar'>

/** Server user type - essential fields from main User interface + server-specific fields */
export type ServerUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'status' | 'createdAt' | 'lastActiveAt' | 'avatar'> & {
  discordId?: string  // Discord ID from providers.discord.id
  minecraftUsername?: string  // Minecraft username from profile.minecraftUsername
}

/** User interaction record (database entity for analytics) */
export interface UserInteraction extends Entity {
  userId: string
  targetType: 'post' | 'reply' | 'comment' | 'user' | 'blog' | 'wiki' | 'guide'
  targetId: string
  interactionType: 'like' | 'dislike' | 'bookmark' | 'share' | 'report' | 'view' | 'helpful'
}