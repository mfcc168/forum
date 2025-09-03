import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { 
  updateReplySchema,
  type CreateReplyData,
  type UpdateReplyData
} from '@/lib/schemas/forum'
import type { ForumReply } from '@/lib/types'
import { useTranslation } from '@/lib/contexts/LanguageContext'

// Frontend validation schema that accepts both slugs and ObjectIds for postId
const frontendCreateReplySchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Reply content must be less than 5000 characters')
    .refine(
      (content) => {
        const textContent = content.replace(/<[^>]*>/g, '').trim()
        return textContent.length > 0
      },
      { message: 'Reply must contain text, not just HTML tags' }
    ),
  replyToId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid reply ID format')
    .optional(),
})

// Fetch replies for a specific post
export function useReplies(postId: string, initialData?: ForumReply[]) {
  return useQuery({
    queryKey: ['forum-replies', postId],
    queryFn: async (): Promise<ForumReply[]> => {
      const response = await fetch(`/api/forum/posts/${postId}/replies`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch replies')
      }
      
      const result = await response.json()
      // Handle nested data structure from API
      return result.success ? (result.data?.data || result.data || []) : []
    },
    enabled: !!postId,
    initialData: initialData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create reply mutation with enhanced validation
export function useCreateReply(postId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  
  return useMutation({
    mutationFn: async (data: CreateReplyData): Promise<ForumReply> => {
      // Validate content and replyToId format only (postId handled by API route)
      frontendCreateReplySchema.parse({
        content: data.content,
        ...(data.replyToId && { replyToId: data.replyToId })
      })
      
      const response = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          replyToId: data.replyToId
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to create reply')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create reply')
      }
      
      return result.data
    },
    onSuccess: () => {
      // Only invalidate queries to refetch fresh data - don't do optimistic updates
      // since the API only returns ID, not full reply object
      queryClient.invalidateQueries({ queryKey: ['forum-replies', postId] })
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] })
      
      toast.success(t.common.replyCreatedSuccessfully)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Update reply mutation with enhanced validation
export function useUpdateReply(postId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  
  return useMutation({
    mutationFn: async ({ replyId, data }: { replyId: string; data: UpdateReplyData }): Promise<ForumReply> => {
      // Validate data with Zod
      const validatedData = updateReplySchema.parse(data)
      
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to update reply')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update reply')
      }
      
      return result.data
    },
    onSuccess: () => {
      // Invalidate replies to refetch
      queryClient.invalidateQueries({ queryKey: ['forum-replies', postId] })
      toast.success(t.common.replyUpdatedSuccessfully)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Delete reply mutation
export function useDeleteReply(postId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  
  return useMutation({
    mutationFn: async (replyId: string): Promise<void> => {
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || error.message || 'Failed to delete reply')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete reply')
      }
    },
    onSuccess: () => {
      // Invalidate replies and post queries to refetch
      queryClient.invalidateQueries({ queryKey: ['forum-replies', postId] })
      queryClient.invalidateQueries({ queryKey: ['forum-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] }) // Update reply counts
      toast.success(t.common.replyDeletedSuccessfully)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export type { CreateReplyData, UpdateReplyData }
// Re-export types from centralized location
export type { ForumReply } from '@/lib/types'