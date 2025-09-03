'use client'

import { useState, useEffect, ReactNode } from 'react'

interface HydrationCheckProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

/**
 * HydrationCheck component to prevent hydration mismatches
 * Shows fallback content during SSR/hydration, then switches to children
 */
export function HydrationCheck({ children, fallback = null, className }: HydrationCheckProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  return <div className={className}>{children}</div>
}

/**
 * Hook to check if component is hydrated
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}