'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@/app/components/ui/Icon'

// ============================================================================
// SIMPLE SEARCH INPUT - NO COMPLEX SUGGESTIONS
// ============================================================================

export interface SimpleSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearchStateChange?: (isSearching: boolean) => void
  placeholder?: string
  className?: string
  variant?: 'default' | 'hero' | 'compact'
  showClearButton?: boolean
  debounceMs?: number
  disabled?: boolean
  autoFocus?: boolean
}

export function SimpleSearchInput({
  value,
  onChange,
  onSearchStateChange,
  placeholder = 'Search...',
  className = '',
  variant = 'default',
  showClearButton = true,
  debounceMs = 200,
  disabled = false,
  autoFocus = false
}: SimpleSearchInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Debounced onChange callback with loading state
  const debouncedOnChange = useCallback((newValue: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Set debouncing state immediately
    setIsDebouncing(true)
    onSearchStateChange?.(true)
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue)
      setIsDebouncing(false)
      onSearchStateChange?.(false)
    }, debounceMs)
  }, [onChange, onSearchStateChange, debounceMs])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    debouncedOnChange(newValue)
  }

  // Handle clear button
  const handleClear = () => {
    setInternalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    onChange(internalValue)
    setIsDebouncing(false)
    onSearchStateChange?.(false)
  }

  // Variant styles
  const variantStyles = {
    default: 'px-4 py-2 text-base',
    hero: 'px-6 py-4 text-lg',
    compact: 'px-3 py-1.5 text-sm'
  }

  const baseClasses = `
    w-full border border-slate-300 rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    placeholder-slate-400 transition-all duration-200
    ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
    ${variantStyles[variant]}
  `.trim()

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <Icon 
          name="search" 
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 ${
            variant === 'hero' ? 'w-6 h-6' : variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'
          }`} 
        />

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseClasses} ${variant === 'hero' ? 'pl-14' : 'pl-10'} ${
            showClearButton && internalValue ? 'pr-10' : 'pr-4'
          }`}
          role="searchbox"
          aria-label="Search"
        />

        {/* Loading Indicator */}
        {isDebouncing && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-blue-500"></div>
          </div>
        )}

        {/* Clear Button */}
        {showClearButton && internalValue && !isDebouncing && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  )
}

// Legacy export for backward compatibility
export const SearchInput = SimpleSearchInput
export type SearchInputProps = SimpleSearchInputProps