'use client'

import { useReducer, useEffect, useCallback, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { LazyWysiwygEditor } from '@/app/components/ui/LazyWysiwygEditor'
import dynamic from 'next/dynamic'

// Lazy load the 3D preview sidebar as a client component
const DexPreviewSidebar = dynamic(() => import('./DexPreviewSidebar').then(mod => ({ default: mod.DexPreviewSidebar })), {
  ssr: false,
  loading: () => (
    <div className="lg:col-span-4 mt-8 lg:mt-0">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">3D Preview</h3>
        <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            <p className="text-slate-600 text-sm">Loading 3D Preview...</p>
          </div>
        </div>
      </Card>
    </div>
  )
})
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
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'wysiwyg' | 'tags' | 'range' | 'model3dPreview'
  required?: boolean
  maxLength?: number
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  help?: string
  placeholder?: string
  autoGenerate?: boolean // For fields like excerpt that can be auto-generated
  hidden?: boolean // For fields that should not be rendered in the UI
  // For range type
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  // For model3dPreview type
  modelPathField?: string // Field name that contains the model path
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

  // Handle model value changes from the 3D editor - ALWAYS define this hook
  const handle3DValueChange = useCallback((values: {
    modelScale: number
    cameraPosition: { x: number; y: number; z: number }
    cameraLookAt: { x: number; y: number; z: number }
  }) => {
    // This will be used if there's a 3D preview
  }, [])

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


  // Check if this is a dex form with 3D preview - AFTER state is initialized
  const has3DPreview = config.fields.some(field => field.type === 'model3dPreview')
  const previewField = config.fields.find(field => field.type === 'model3dPreview')
  const modelPath = previewField?.modelPathField ? state.formData[previewField.modelPathField] as string : ''

  // Get current values from form state for 3D preview
  const currentModelScale = (state.formData['modelScale'] as number) || 1.0
  const currentCameraPosition = {
    x: (state.formData['camera.position.x'] as number) || 2,
    y: (state.formData['camera.position.y'] as number) || 2,
    z: (state.formData['camera.position.z'] as number) || 4
  }
  const currentCameraLookAt = {
    x: (state.formData['camera.lookAt.x'] as number) || 0,
    y: (state.formData['camera.lookAt.y'] as number) || 0,
    z: (state.formData['camera.lookAt.z'] as number) || 0
  }

  // Update form data when item changes (for edit mode)
  useEffect(() => {
    if (item) {
      const formState = createInitialFormState(config, item, initialData)
      dispatch({ type: 'SET_INITIAL_DATA', data: formState.formData })
    }
  }, [item, config, initialData])

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
  }, [dispatch])


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
        const result = await updateMutation.mutateAsync({
          slug: identifier,
          data: validatedData
        })
        // Use the updated item's slug in case it changed during the update
        const updatedIdentifier = result?.slug || identifier
        onSuccess(updatedIdentifier)
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

      case 'multiselect':
        const multiselectOptions = field.options || []
        // Parse current value as array or default to empty array
        const selectedValues = Array.isArray(value) ? value : (value ? value.split(',').map((v: string) => v.trim()) : [])
        
        const handleMultiselectChange = (optionValue: string) => {
          const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter(v => v !== optionValue)
            : [...selectedValues, optionValue]
          handleFieldChange(field.name, newValues)
        }
        
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {multiselectOptions.map((option, index) => (
                <label 
                  key={option.value || `multiselect-${index}`}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleMultiselectChange(option.value)}
                    disabled={option.disabled}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedValues.map((selectedValue) => {
                  const option = multiselectOptions.find(opt => opt.value === selectedValue)
                  return option ? (
                    <span 
                      key={selectedValue}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={() => handleMultiselectChange(selectedValue)}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-emerald-200"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
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

      case 'range':
        const numericValue = typeof value === 'string' ? parseFloat(value) || field.defaultValue || 0 : (value as number) || field.defaultValue || 0
        const displayValue = field.name === 'modelScale' ? numericValue.toFixed(2) : numericValue.toString()
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Current value: <span className="text-emerald-600">{displayValue}</span>
              </span>
              <button
                type="button"
                onClick={() => handleFieldChange(field.name, field.defaultValue || 0)}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
            </div>
            <input
              type="range"
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              value={numericValue}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{field.min || 0}</span>
              <span>{field.max || 100}</span>
            </div>
          </div>
        )

      case 'model3dPreview':
        // This case is handled in the special sidebar section
        return null

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

  // Layout exactly matching detail page structure for proper sticky positioning
  if (has3DPreview) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Side - Form Content (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {isEditing ? config.submitText.edit : config.submitText.create}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
            {config.fields.filter(field => !field.hidden && field.type !== 'model3dPreview').map(field => (
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
          
          {/* Custom CSS for range sliders */}
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              cursor: pointer;
            }
            .slider::-webkit-slider-thumb:hover {
              background: #059669;
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              cursor: pointer;
              border: none;
            }
            .slider::-moz-range-thumb:hover {
              background: #059669;
            }
          `}</style>
          </div>
        </div>

        {/* 3D Preview Sidebar - Client Component */}
        <DexPreviewSidebar
          modelPath={modelPath}
          currentModelScale={currentModelScale}
          currentCameraPosition={currentCameraPosition}
          currentCameraLookAt={currentCameraLookAt}
          onFieldChange={handleFieldChange}
        />
        </div>
      </div>
    )
  }

  // Non-3D preview layout (original)
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-6">
        {isEditing ? config.submitText.edit : config.submitText.create}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {config.fields.filter(field => !field.hidden && field.type !== 'model3dPreview').map(field => (
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
      
      {/* Custom CSS for range sliders */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        .slider::-webkit-slider-thumb:hover {
          background: #059669;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
          border: none;
        }
        .slider::-moz-range-thumb:hover {
          background: #059669;
        }
      `}</style>
    </Card>
  )
}

export default memo(ContentForm)