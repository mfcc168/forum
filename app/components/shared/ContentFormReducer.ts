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
    let value: unknown
    
    // Handle nested field paths for extracting values from existing items
    if (field.name.includes('.') && item) {
      value = getNestedValue(item as Record<string, unknown>, field.name)
    } else {
      // Prioritize initialData when provided, as it's often pre-processed/flattened
      value = initialData?.[field.name as keyof T] || item?.[field.name as keyof T]
    }
    
    switch (field.type) {
      case 'tags':
        formData[field.name] = Array.isArray(value) ? value.join(', ') : value || ''
        break
      case 'multiselect':
        formData[field.name] = Array.isArray(value) ? value : []
        break
      case 'select':
        // Handle different types of select fields
        if (field.name === 'modelPath') {
          // Model path should start empty to force user selection
          formData[field.name] = value || ''
        } else if (field.name === 'category' || field.name.includes('category')) {
          // Category fields use config default
          formData[field.name] = value || (field.options?.[0]?.value) || config.categoryConfig?.getDefault?.() || ''
        } else if (field.required && field.options && field.options.length > 0) {
          // Required select fields should default to first valid option
          const firstValidOption = field.options.find(opt => opt.value && !opt.disabled)
          formData[field.name] = value || firstValidOption?.value || ''
        } else {
          // Optional select fields can be empty
          formData[field.name] = value || ''
        }
        break
      case 'range':
        // Range fields should use numeric values with defaults
        if (typeof value === 'number') {
          formData[field.name] = value
        } else if (typeof value === 'string' && value !== '') {
          const numValue = parseFloat(value)
          formData[field.name] = isNaN(numValue) ? (field.defaultValue || 0) : numValue
        } else {
          formData[field.name] = field.defaultValue || 0
        }
        break
      case 'model3dPreview':
        // Preview fields are read-only, don't store data
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

// Helper functions for nested object paths
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  
  current[keys[keys.length - 1]] = value
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }
  
  return current
}

// Helper functions for form validation and data transformation
export function processFormData(formData: Record<string, unknown>, fields: ContentFormField[]): Record<string, unknown> {
  const processed: Record<string, unknown> = {}
  
  fields.forEach(field => {
    const value = formData[field.name]
    let processedValue: unknown
    
    switch (field.type) {
      case 'tags':
        // Convert comma-separated string to array
        if (typeof value === 'string') {
          processedValue = value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        } else {
          processedValue = []
        }
        break
      
      case 'multiselect':
        // Ensure array format
        if (Array.isArray(value)) {
          processedValue = value.filter(v => v && typeof v === 'string')
        } else {
          processedValue = []
        }
        break
      
      case 'wysiwyg':
      case 'textarea':
        // Ensure string content
        processedValue = typeof value === 'string' ? value.trim() : ''
        break
      
      case 'text':
        // Handle numeric conversions for nested field paths and modelScale
        if (field.name.match(/^(stats\.|spawning\.lightLevel\.|camera\.|modelScale$)/)) {
          // Convert string numbers to actual numbers for stats, light levels, camera positions, and model scale
          const stringValue = typeof value === 'string' ? value.trim() : String(value)
          if (stringValue && !isNaN(Number(stringValue))) {
            processedValue = Number(stringValue)
          } else if (stringValue === '' || stringValue === undefined || stringValue === null) {
            processedValue = undefined // Allow empty values for optional numeric fields
          } else {
            processedValue = value
          }
        } else {
          processedValue = value
        }
        break
      
      case 'select':
        // Handle empty strings for optional enum fields - convert to undefined
        if (value === '' && !field.required) {
          processedValue = undefined
        } else {
          processedValue = value
        }
        break
      
      case 'range':
        // Range fields should use numeric values
        if (typeof value === 'number') {
          processedValue = value
        } else if (typeof value === 'string' && value !== '') {
          const numValue = parseFloat(value)
          processedValue = isNaN(numValue) ? (field.defaultValue || 0) : numValue
        } else {
          processedValue = field.defaultValue || 0
        }
        
        break
      
      default:
        processedValue = value
    }
    
    // Handle nested field paths (e.g., 'stats.health' -> { stats: { health: value } })
    if (field.name.includes('.')) {
      // Skip undefined values for optional fields to avoid creating empty nested objects
      if (processedValue !== undefined) {
        setNestedValue(processed, field.name, processedValue)
      }
    } else {
      processed[field.name] = processedValue
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