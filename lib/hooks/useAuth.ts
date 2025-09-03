import { useQuery } from '@tanstack/react-query'
import type { AuthUser } from '@/lib/types'

/**
 * Get current authenticated user
 * Cached for 5 minutes, shared across all components
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const response = await fetch('/api/auth/user')
        
        if (!response.ok) {
          if (response.status === 401) {
            return null // Not authenticated
          }
          throw new Error('Failed to fetch user')
        }
        
        return response.json()
      } catch (error) {
        console.error('Auth error:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser()
  return {
    isAuthenticated: !!user,
    isLoading,
    user
  }
}