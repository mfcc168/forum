/**
 * ContentForm state management with useReducer
 * Optimizes complex form state updates and validation
 */

import type { ContentFormField, ContentFormConfig } from './ContentForm'
import type { ContentItem } from '@/lib/types'

// Form state interface
export interface FormState {
  formData: Record<string, unknown>
  error: string
  isValidating: boolean
  isDirty: boolean
  touchedFields: Set<string>
}

// Action types for form state updates
export type FormAction =
  | { type: 'FIELD_CHANGE'; field: string; value: unknown }
  | { type: 'FIELD_TOUCH'; field: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_VALIDATING'; isValidating: boolean }
  | { type: 'RESET_FORM'; initialData: Record<string, unknown> }
  | { type: 'SET_INITIAL_DATA'; data: Record<string, unknown> }
  | { type: 'BULK_UPDATE'; data: Record<string, unknown> }

// Initial state factory
export function createInitialFormState<T extends ContentItem>(
  config: ContentFormConfig<T>,
  item?: T,
  initialData?: Partial<T>
): FormState {
  const formData: Record<string, unknown> = {}
  
  config.fields.forEach(field => {
    const value = item?.[field.name as keyof T] || initialData?.[field.name as keyof T]
    
    switch (field.type) {
      case 'tags':
        formData[field.name] = Array.isArray(value) ? value.join(', ') : value || ''
        break
      case 'select':
        formData[field.name] = value || (field.options?.[0]?.value) || config.categoryConfig?.getDefault?.() || ''
        break
      default:
        formData[field.name] = value || ''
    }
  })

  return {
    formData,
    error: '',
    isValidating: false,
    isDirty: false,
    touchedFields: new Set<string>()
  }
}

// Form reducer function
export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'FIELD_CHANGE':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value
        },
        isDirty: true,
        error: '' // Clear error on field change
      }
    
    case 'FIELD_TOUCH':
      return {
        ...state,
        touchedFields: new Set([...state.touchedFields, action.field])
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isValidating: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: ''
      }
    
    case 'SET_VALIDATING':
      return {
        ...state,
        isValidating: action.isValidating
      }
    
    case 'RESET_FORM':
      return {
        ...state,
        formData: action.initialData,
        error: '',
        isDirty: false,
        touchedFields: new Set<string>()
      }
    
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        formData: action.data,
        isDirty: false
      }
    
    case 'BULK_UPDATE':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.data
        },
        isDirty: true
      }
    
    default:
      return state
  }
}

// Helper functions for form validation and data transformation
export function processFormData(formData: Record<string, unknown>, fields: ContentFormField[]): Record<string, unknown> {
  const processed: Record<string, unknown> = {}
  
  fields.forEach(field => {
    const value = formData[field.name]
    
    switch (field.type) {
      case 'tags':
        // Convert comma-separated string to array
        if (typeof value === 'string') {
          processed[field.name] = value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        } else {
          processed[field.name] = []
        }
        break
      
      case 'wysiwyg':
      case 'textarea':
        // Ensure string content
        processed[field.name] = typeof value === 'string' ? value.trim() : ''
        break
      
      default:
        processed[field.name] = value
    }
  })
  
  return processed
}

// Field validation helper
export function validateField(
  fieldName: string,
  value: unknown,
  field: ContentFormField,
  allData: Record<string, unknown>
): string | null {
  // Required field validation
  if (field.required) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${field.label} is required`
    }
  }
  
  // String length validation
  if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
    return `${field.label} must be less than ${field.maxLength} characters`
  }
  
  // Type-specific validation
  switch (field.type) {
    case 'tags':
      if (typeof value === 'string') {
        const tags = value.split(',').map(tag => tag.trim()).filter(Boolean)
        if (tags.length > 10) {
          return 'Maximum 10 tags allowed'
        }
      }
      break
    
    // Add more field-specific validation as needed
  }
  
  return null
}

// Auto-generation helpers
export function autoGenerateExcerpt(content: string, maxLength: number = 150): string {
  if (!content) return ''
  
  // Strip HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  
  if (plainText.length <= maxLength) return plainText
  
  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength)
  const lastSentence = truncated.lastIndexOf('.')
  
  if (lastSentence > maxLength * 0.6) {
    return plainText.substring(0, lastSentence + 1)
  }
  
  // Fallback to word boundary
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 
    ? plainText.substring(0, lastSpace) + '...'
    : truncated + '...'
}

export function autoGenerateSlug(title: string): string {
  if (!title) return ''
  
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}