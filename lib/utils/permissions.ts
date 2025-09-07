/**
 * Permission utilities for content access control.
 * 
 * Implements role-based permissions per module:
 * - Wiki & Blog: Admin-only creation and editing
 * - Forum: Member creation, author/admin editing
 */

import type { ContentModule, ContentItem, PartialContentItem, PermissionUser } from '@/lib/types'

export class PermissionChecker {
  /**
   * Check if user can create content in the specified module.
   * @param user - User to check permissions for
   * @param module - Content module (wiki/blog/forum)
   * @returns True if user can create content
   */
  static canCreate(user: PermissionUser | null, module: ContentModule): boolean {
    if (!user) return false

    switch (module) {
      case 'wiki':
      case 'blog':
        return user.role === 'admin'
      case 'forum':
        return ['admin', 'moderator', 'vip', 'member'].includes(user.role)
      default:
        return false
    }
  }

  /**
   * Check if user can edit content in the specified module.
   * @param user - User to check permissions for
   * @param module - Content module (wiki/blog/forum)
   * @param content - Content item being edited (required for forum ownership check)
   * @returns True if user can edit content
   */
  static canEdit(user: PermissionUser | null, module: ContentModule, content?: ContentItem | PartialContentItem): boolean {
    if (!user) return false

    switch (module) {
      case 'wiki':
      case 'blog':
        return user.role === 'admin'
      case 'forum':
        const isAuthor = content?.author?.id === user.id
        return user.role === 'admin' || isAuthor
      default:
        return false
    }
  }

  /**
   * Check if user can delete content in the specified module.
   * @param user - User to check permissions for  
   * @param module - Content module (wiki/blog/forum)
   * @param content - Content item being deleted (required for forum ownership check)
   * @returns True if user can delete content
   */
  static canDelete(user: PermissionUser | null, module: ContentModule, content?: ContentItem | PartialContentItem): boolean {
    if (!user) return false

    switch (module) {
      case 'wiki':
      case 'blog':
        return user.role === 'admin'
      case 'forum':
        const isAuthor = content?.author?.id === user.id
        return user.role === 'admin' || isAuthor
      default:
        return false
    }
  }

  /**
   * Check if user can view non-published content.
   * @param user - User to check permissions for
   * @param module - Content module (wiki/blog/forum)  
   * @returns True if user can view draft/archived content
   */
  static canViewDrafts(user: PermissionUser | null, module: ContentModule): boolean {
    if (!user) return false

    switch (module) {
      case 'wiki':
      case 'blog':
        return user.role === 'admin'
      case 'forum':
        return ['admin', 'moderator'].includes(user.role)
      default:
        return false
    }
  }

  static isAdmin(user: PermissionUser | null): boolean {
    return user?.role === 'admin'
  }

  static isModerator(user: PermissionUser | null): boolean {
    return user ? ['admin', 'moderator'].includes(user.role) : false
  }

  static isAuthor(user: PermissionUser | null, content?: ContentItem | PartialContentItem): boolean {
    return !!(user && content?.author?.id === user.id)
  }

  /**
   * Get comprehensive permission object for content actions.
   * @param user - User to check permissions for
   * @param module - Content module (wiki/blog/forum)
   * @param content - Content item (for ownership checks)
   * @returns Object with all permission flags
   */
  static getContentPermissions(user: PermissionUser | null, module: ContentModule, content?: ContentItem | PartialContentItem) {
    return {
      canCreate: this.canCreate(user, module),
      canEdit: this.canEdit(user, module, content),
      canDelete: this.canDelete(user, module, content),
      canViewDrafts: this.canViewDrafts(user, module),
      isAdmin: this.isAdmin(user),
      isModerator: this.isModerator(user),
      isAuthor: this.isAuthor(user, content)
    }
  }
}

