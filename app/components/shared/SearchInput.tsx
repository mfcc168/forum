'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@/app/components/ui/Icon'
import { useSearchSuggestions } from '@/lib/hooks/useSearch'

// ============================================================================
// INTERFACES
// ============================================================================

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearchStateChange?: (isSearching: boolean) => void
  placeholder?: string
  className?: string
  variant?: 'default' | 'hero' | 'compact'
  showSuggestions?: boolean
  showClearButton?: boolean
  debounceMs?: number
  disabled?: boolean
  autoFocus?: boolean
  module?: 'blog' | 'forum' | 'wiki' // Module context for suggestions
}

interface SearchSuggestionItemProps {
  suggestion: any
  isSelected: boolean
  onClick: () => void
}

// ============================================================================
// SEARCH INPUT COMPONENT
// ============================================================================

export function SearchInput({
  value,
  onChange,
  onSearchStateChange,
  placeholder = 'Search...',
  className = '',
  variant = 'default',
  showSuggestions = true,
  showClearButton = true,
  debounceMs = 200, // Reduced from 300ms for snappier feel
  disabled = false,
  autoFocus = false,
  module
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const [isDebouncing, setIsDebouncing] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Get suggestions if enabled
  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(
    internalValue,
    { 
      enabled: showSuggestions && internalValue.length >= 2,
      debounceMs: 200,
      module
    }
  )

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

  // Handle input changes with immediate auto-search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    
    const newValue = e.target.value
    setInternalValue(newValue)
    setSelectedSuggestion(-1)
    
    // Show suggestions for queries >= 2 characters
    if (showSuggestions && newValue.length >= 2) {
      setShowSuggestionsDropdown(true)
    } else {
      setShowSuggestionsDropdown(false)
    }

    // Trigger debounced search
    debouncedOnChange(newValue)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (showSuggestionsDropdown && suggestions.length > 0) {
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (showSuggestionsDropdown) {
          setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
          handleSuggestionSelect(suggestions[selectedSuggestion])
        }
        break
      case 'Escape':
        setShowSuggestionsDropdown(false)
        setSelectedSuggestion(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    setInternalValue(suggestion.text)
    onChange(suggestion.text)
    setShowSuggestionsDropdown(false)
    setSelectedSuggestion(-1)
  }

  // Handle clear search
  const handleClear = () => {
    if (disabled) return
    setInternalValue('')
    setIsDebouncing(false)
    // Clear any pending debounced calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    onSearchStateChange?.(false)
    onChange('')
    setShowSuggestionsDropdown(false)
    inputRef.current?.focus()
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsDropdown(false)
        setSelectedSuggestion(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Styling classes
  const containerClasses = `relative ${className}`
  
  const inputClasses = variant === 'hero' 
    ? `w-full pl-12 pr-16 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    : variant === 'compact'
    ? `w-full pl-10 pr-12 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
    : `w-full px-4 py-3 pl-12 ${showClearButton && internalValue ? 'pr-12' : 'pr-4'} bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  const iconColor = variant === 'hero' ? 'text-white/70' : 'text-slate-400'
  const iconSize = variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className={containerClasses}>
      {/* Search Input */}
      <div className="relative">
        <Icon 
          name="search" 
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${iconSize} ${iconColor}`} 
        />
        
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => internalValue.length >= 2 && showSuggestions && setShowSuggestionsDropdown(true)}
          disabled={disabled}
          className={inputClasses}
          role="searchbox"
          aria-label="Search content"
          aria-expanded={showSuggestionsDropdown}
          aria-haspopup="listbox"
        />

        {/* Clear Button */}
        {showClearButton && internalValue && !disabled && (
          <button
            onClick={handleClear}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors ${iconColor} hover:text-slate-600`}
            aria-label="Clear search"
          >
            <Icon name="x" className={iconSize} />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && showSuggestionsDropdown && (suggestions.length > 0 || suggestionsLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {suggestionsLoading && (
            <div className="p-4 text-center text-slate-500">
              <Icon name="loader" className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading suggestions...
            </div>
          )}

          {!suggestionsLoading && suggestions.length > 0 && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <SearchSuggestionItem
                  key={`${suggestion.type}-${index}`}
                  suggestion={suggestion}
                  isSelected={selectedSuggestion === index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SEARCH SUGGESTION ITEM COMPONENT
// ============================================================================

function SearchSuggestionItem({ suggestion, isSelected, onClick }: SearchSuggestionItemProps) {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'recent': return 'clock'
      case 'popular': return 'trending-up'
      case 'completion': return 'search'
      case 'correction': return 'spell-check'
      default: return 'search'
    }
  }

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors ${
        isSelected 
          ? 'bg-emerald-50 text-emerald-900' 
          : 'hover:bg-slate-50 text-slate-700'
      }`}
      role="option"
      aria-selected={isSelected}
    >
      <Icon name={getIcon()} className="w-4 h-4 text-slate-400" />
      <span className="flex-1">{suggestion.text}</span>
      {suggestion.count && (
        <span className="text-xs text-slate-400">
          {suggestion.count.toLocaleString()}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// CLEAR SEARCH BUTTON COMPONENT (WIKI STYLE)
// ============================================================================

interface ClearSearchButtonProps {
  onClick: () => void
  query: string
  className?: string
}

export function ClearSearchButton({ onClick, query, className = '' }: ClearSearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-sm text-slate-500 hover:text-slate-700 flex items-center space-x-1 transition-colors ${className}`}
    >
      <Icon name="x" className="w-4 h-4" />
      <span>Clear search</span>
    </button>
  )
}

// ============================================================================
// SEARCH RESULTS HEADER COMPONENT (CONSISTENT STYLING)
// ============================================================================

export interface SearchResultsHeaderProps {
  query: string
  resultCount: number
  onClear: () => void
  module?: string
  className?: string
}

export function SearchResultsHeader({ 
  query, 
  resultCount, 
  onClear, 
  module, 
  className = '' 
}: SearchResultsHeaderProps) {
  const getModuleName = () => {
    switch (module) {
      case 'blog': return 'blog posts'
      case 'forum': return 'forum posts' 
      case 'wiki': return 'guides'
      default: return 'results'
    }
  }

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Search Results for &ldquo;{query}&rdquo;
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Found {resultCount.toLocaleString()} {resultCount === 1 ? getModuleName().slice(0, -1) : getModuleName()}
        </p>
      </div>
      <ClearSearchButton onClick={onClear} query={query} />
    </div>
  )
}