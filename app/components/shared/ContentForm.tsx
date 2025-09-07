'use client'

import { useReducer, useEffect, useCallback, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { LazyWysiwygEditor } from '@/app/components/ui/LazyWysiwygEditor'
// Translation support available for future features
// import { useTranslation } from '@/lib/contexts/LanguageContext'
import type { ZodSchema } from 'zod'
import { ZodError } from 'zod'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { ContentItem } from '@/lib/types'
import { 
  formReducer, 
  createInitialFormState, 
  processFormData, 
  validateField,
  autoGenerateExcerpt,
  autoGenerateSlug,
  type FormAction 
} from './ContentFormReducer'

// Hook result types - properly typed
type CreateMutationHook<T = ContentItem> = UseMutationResult<T, Error, Partial<T>>
type UpdateMutationHook<T = ContentItem> = UseMutationResult<T, Error, { slug: string; data: Partial<T> }>
type CategoriesQueryHook = UseQueryResult<Array<{ value: string; label: string; disabled?: boolean }>, Error>

export interface ContentFormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'wysiwyg' | 'tags'
  required?: boolean
  maxLength?: number
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  help?: string
  placeholder?: string
  autoGenerate?: boolean // For fields like excerpt that can be auto-generated
}

export interface ContentFormConfig<T = ContentItem> {
  fields: ContentFormField[]
  validation: {
    create: ZodSchema
    update: ZodSchema
  }
  module: 'blog' | 'wiki' | 'forum' | 'dex' // Required for centralized permission checking
  submitText: {
    create: string
    edit: string
    creating: string
    editing: string
  }
  categoryConfig: {
    getCategories: () => Array<{ value: string; label: string; disabled?: boolean }>
    getDefault: () => string
    translateName?: (name: string) => string
  }
  hooks: {
    useCreate: () => CreateMutationHook<T>
    useUpdate: () => UpdateMutationHook<T>
    useCategories?: () => CategoriesQueryHook
  }
  routing: {
    getEditPath: (item: T) => string
    getViewPath: (item: T) => string
  }
}

interface ContentFormProps<T extends ContentItem = ContentItem> {
  config: ContentFormConfig<T>
  item?: T // If provided, we're editing; otherwise, creating
  onSuccess: (identifier: string) => void // Could be ID or slug depending on config
  onCancel: () => void
  initialData?: Partial<T>
}

export function ContentForm<T extends ContentItem = ContentItem>({ 
  config, 
  item, 
  onSuccess, 
  onCancel, 
  initialData 
}: ContentFormProps<T>) {
  const { data: session } = useSession()
  const permissions = usePermissions(session, config.module, item)

  // Permission check - use centralized permissions system
  const hasPermission = useMemo(() => {
    const isEditing = !!(item?.id || item?.slug)
    return isEditing ? permissions.canEdit : permissions.canCreate
  }, [permissions, item])

  // Optimized state management with useReducer for complex forms
  const [state, dispatch] = useReducer(
    formReducer, 
    createInitialFormState(config, item, initialData)
  )

  // Update form data when item changes (for edit mode)
  useEffect(() => {
    if (item) {
      const initialData = createInitialFormState(config, item)
      dispatch({ type: 'SET_INITIAL_DATA', data: initialData.formData })
    }
  }, [item, config])

  // Get hooks dynamically from config
  const createMutation = config.hooks.useCreate()
  const updateMutation = config.hooks.useUpdate()
  // Categories query available for future dynamic category loading
  // const categoriesQuery = config.hooks.useCategories?.()

  const isEditing = useMemo(() => !!(item?.id || item?.slug), [item])
  const mutation = useMemo(() => isEditing ? updateMutation : createMutation, [isEditing, updateMutation, createMutation])
  const isSubmitting = mutation?.isPending || false

  // Auto-generation logic (e.g., excerpt from content)  
  useEffect(() => {
    const excerptField = config.fields.find(f => f.name === 'excerpt' && f.autoGenerate)
    const contentValue = state.formData.content as string
    if (excerptField && !state.formData.excerpt && contentValue) {
      const excerpt = autoGenerateExcerpt(contentValue, 150)
      if (excerpt) {
        dispatch({ type: 'FIELD_CHANGE', field: 'excerpt', value: excerpt })
      }
    }
  }, [state.formData.content, state.formData.excerpt, config.fields])

  // Handle form field changes with optimized dispatch
  const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
    dispatch({ type: 'FIELD_CHANGE', field: fieldName, value })
    dispatch({ type: 'FIELD_TOUCH', field: fieldName })
  }, [])

  // Form validation and submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasPermission) {
      dispatch({ type: 'SET_ERROR', error: 'You do not have permission to perform this action' })
      return
    }

    dispatch({ type: 'SET_VALIDATING', isValidating: true })

    // Process form data using optimized helper
    const submitData = processFormData(state.formData, config.fields)

    try {
      // Validate with appropriate schema
      const schema = isEditing ? config.validation.update : config.validation.create
      const validatedData = schema.parse(submitData)

      // Submit the data
      if (isEditing && (item?.id || item?.slug)) {
        const identifier = item.slug || item.id!
        await updateMutation.mutateAsync({
          slug: identifier,
          data: validatedData
        })
        onSuccess(identifier)
      } else {
        const result = await createMutation.mutateAsync(validatedData)
        const identifier = result.slug || result.id
        if (identifier) {
          onSuccess(identifier)
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        dispatch({ type: 'SET_ERROR', error: `Validation errors: ${fieldErrors}` })
      } else if (error instanceof Error) {
        dispatch({ type: 'SET_ERROR', error: error.message })
      } else {
        dispatch({ type: 'SET_ERROR', error: 'An unexpected error occurred. Please try again.' })
      }
    }
  }, [state.formData, hasPermission, isEditing, item, config, createMutation, updateMutation, onSuccess])

  // Render field based on type with optimized state access
  const renderField = useCallback((field: ContentFormField) => {
    const value = (state.formData[field.name] as string) || ''
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
            required={field.required}
          />
        )

      case 'select':
        const options = field.options || config.categoryConfig.getCategories()
        // Ensure unique keys by filtering out invalid options and adding fallback keys
        const validOptions = options
          .filter(option => option && typeof option === 'object' && option.value)
          .map((option, index) => ({
            ...option,
            uniqueKey: option.value || `option-${index}`
          }))
        
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required={field.required}
          >
            {validOptions.map((option, index) => (
              <option 
                key={option.uniqueKey || `option-${index}`}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'wysiwyg':
        return (
          <LazyWysiwygEditor
            value={value}
            onChange={(newContent: string) => handleFieldChange(field.name, newContent)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'tags':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder || "Enter tags separated by commas"}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        )

      default:
        return null
    }
  }, [state.formData, handleFieldChange, config])

  if (!hasPermission) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600">You do not have permission to access this form.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">
        {isEditing ? config.submitText.edit : config.submitText.create}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {config.fields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {field.help && (
              <p className="mt-1 text-sm text-slate-500">{field.help}</p>
            )}
            
            {field.maxLength && state.formData[field.name] ? (
              <div className="mt-1 text-xs text-slate-400">
                {String(state.formData[field.name] || '').length} / {field.maxLength} characters
              </div>
            ) : null}
          </div>
        ))}

        {state.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting 
              ? (isEditing ? config.submitText.editing : config.submitText.creating)
              : (isEditing ? config.submitText.edit : config.submitText.create)
            }
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default memo(ContentForm)