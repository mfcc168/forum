/**
 * React hook for permission checking
 */

import { PermissionChecker } from '@/lib/utils/permissions'
import type { ContentModule, ContentItem, PartialContentItem, UserRole, PermissionUser } from '@/lib/types'

/**
 * React hook for content permissions.
 * 
 * @param session - NextAuth session object
 * @param module - Content module (wiki/blog/forum) 
 * @param content - Content item (for ownership checks)
 * @returns Permission object with boolean flags
 */
export function usePermissions(
  session: { user?: { id: string; role?: UserRole } } | null, 
  module: ContentModule, 
  content?: ContentItem | PartialContentItem
) {
  const user: PermissionUser | null = (session?.user && session.user.role) ? {
    id: session.user.id,
    role: session.user.role
  } : null

  return PermissionChecker.getContentPermissions(user, module, content)
}