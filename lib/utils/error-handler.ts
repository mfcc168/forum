/**
 * Centralized Error Handling Utility
 * 
 * Provides consistent error handling patterns across the application
 */

import { ZodError } from 'zod'
import { toast } from 'react-hot-toast'
import type { ValidationErrorDetail } from '@/lib/types'

export class DatabaseError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(message: string, code = 'DATABASE_ERROR', statusCode = 500, details?: unknown) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'ValidationError'
    this.code = 'VALIDATION_ERROR'
    this.statusCode = 400
    this.details = details
  }
}

/**
 * Standardized error handler for database operations
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database error in ${operation}:`, error)
  
  if (error instanceof Error) {
    throw new DatabaseError(
      `Failed to ${operation}: ${error.message}`,
      'DATABASE_OPERATION_ERROR',
      500,
      { originalError: error.message, operation }
    )
  }
  
  throw new DatabaseError(
    `Failed to ${operation}: Unknown error`,
    'DATABASE_UNKNOWN_ERROR',
    500,
    { operation }
  )
}

/**
 * Standardized validation error handler
 */
export function handleValidationError(error: ZodError, context?: string): never {
  const details: ValidationErrorDetail[] = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
  
  const message = context 
    ? `Validation failed for ${context}: ${details.map(d => d.message).join(', ')}`
    : `Validation failed: ${details.map(d => d.message).join(', ')}`
  
  throw new ValidationError(message, details)
}

/**
 * Client-side error handler with toast notifications
 */
export function handleClientError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
  console.error('Client error:', error)
  
  if (error instanceof Error) {
    toast.error(error.message)
    return error.message
  }
  
  toast.error(fallbackMessage)
  return fallbackMessage
}

/**
 * API error response formatter
 */
export function formatApiError(error: unknown): {
  error: string
  code: string
  details?: unknown
  statusCode: number
} {
  if (error instanceof DatabaseError || error instanceof ValidationError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode
    }
  }
  
  if (error instanceof ZodError) {
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((err): ValidationErrorDetail => ({
        field: err.path.join('.'),
        message: err.message
      })),
      statusCode: 400
    }
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500
    }
  }
  
  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500
  }
}

/**
 * Async error wrapper for database operations
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  operation: T,
  operationName: string
): T {
  const wrappedFunction = async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await operation(...args) as Awaited<ReturnType<T>>
    } catch (error) {
      return handleDatabaseError(error, operationName)
    }
  }
  
  return wrappedFunction as T
}