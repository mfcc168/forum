import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'
import { PermissionChecker } from '@/lib/utils/permissions'
import type { ServerUser } from "@/lib/types"
import { updateReplySchema, type UpdateReplyData } from '@/lib/schemas/forum'

export const runtime = 'nodejs'

// Path parameter type
type ReplyIdData = {
  id: string
}

// PUT - Update reply (consistent with other API routes)
export const PUT = withDALAndValidation(
  async (request: NextRequest, { user, params, validatedData, dal }: { user?: ServerUser; params: Promise<ReplyIdData>; validatedData: UpdateReplyData; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { id } = await params

    // Get current reply to check permissions
    const currentReply = await dal.forum.getReplyById(id)
    
    if (!currentReply) {
      return ApiResponse.error('Reply not found', 404)
    }

    // Check forum reply edit permissions using centralized system
    if (!PermissionChecker.canEdit(user, 'forum', currentReply)) {
      return ApiResponse.error('You can only edit your own replies', 403)
    }

    // Update the reply using DAL
    const success = await dal.forum.updateReply(id, { content: validatedData.content })
    
    if (!success) {
      return ApiResponse.error('Failed to update reply', 500)
    }

    // Get the updated reply for consistent response format
    const updatedReply = await dal.forum.getReplyById(id)
    
    return ApiResponse.success({ reply: updatedReply }, 'Reply updated successfully')
  },
  {
    schema: updateReplySchema,
    auth: 'required',
    rateLimit: { requests: 10, window: '1m' }
  }
)

// DELETE - Delete reply (consistent with other API routes)
export const DELETE = withDALAndValidation(
  async (request: NextRequest, { user, params, dal }: { user?: ServerUser; params: Promise<ReplyIdData>; dal: typeof DAL }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    const { id } = await params

    // Get current reply to check permissions
    const currentReply = await dal.forum.getReplyById(id)
    
    if (!currentReply) {
      return ApiResponse.error('Reply not found', 404)
    }

    // Check forum reply delete permissions using centralized system
    if (!PermissionChecker.canDelete(user, 'forum', currentReply)) {
      return ApiResponse.error('You can only delete your own replies', 403)
    }

    // Delete the reply using DAL (soft delete with stats update)
    const success = await dal.forum.deleteReply(id)
    
    if (!success) {
      return ApiResponse.error('Failed to delete reply', 500)
    }

    return ApiResponse.success(null, 'Reply deleted successfully')
  },
  {
    auth: 'required',
    rateLimit: { requests: 5, window: '1m' }
  }
)