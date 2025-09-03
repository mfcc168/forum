/**
 * Standardized error handling utilities for consistent error management.
 */

export interface AppError {
  message: string
  code?: string
  statusCode?: number
  details?: Record<string, unknown>
}

/**
 * Extract user-friendly message from various error types.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return 'An unexpected error occurred'
}

/**
 * Log error with consistent format and return user message.
 */
export function handleError(error: unknown, context: string): string {
  const message = getErrorMessage(error)
  console.error(`[${context}] Error:`, error)
  return message
}

/**
 * Standard error handler for API mutations.
 */
export function handleMutationError(error: unknown, action: string, itemType: string = 'item'): string {
  const message = getErrorMessage(error)
  console.error(`${action} ${itemType} error:`, error)
  return message.includes('Failed') ? message : `Failed to ${action} ${itemType}: ${message}`
}

/**
 * Check if error indicates a network/connection issue.
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('network') || 
         message.includes('fetch') || 
         message.includes('connection') ||
         message.includes('timeout')
}

/**
 * Check if error indicates an authorization issue.
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number(error.status)
    return status === 401 || status === 403
  }
  
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('unauthorized') || 
         message.includes('forbidden') ||
         message.includes('sign in')
}