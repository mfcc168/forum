'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/app/components/ui/Icon'
import { Button } from '@/app/components/ui/Button'
import { GlobalSearch } from './GlobalSearch'

interface SearchTriggerProps {
  className?: string
  variant?: 'button' | 'input'
}

export function SearchTrigger({ className = '', variant = 'button' }: SearchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (variant === 'input') {
    return (
      <>
        <div 
          onClick={() => setIsOpen(true)}
          className={`flex items-center space-x-3 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
        >
          <Icon name="search" className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 flex-1">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded">
            {typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
        <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    )
  }

  return (
    <>
      <Button
        variant="outline" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 ${className}`}
      >
        <Icon name="search" className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded">
          {typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </Button>
      <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}