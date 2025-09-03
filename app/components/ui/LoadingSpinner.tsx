import React from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinnerProps, SkeletonProps } from '@/lib/types'

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className 
}: LoadingSpinnerProps) {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  } as const

  const colors = {
    primary: 'text-emerald-600',
    secondary: 'text-slate-600',
    white: 'text-white'
  }

  return (
    <div className={cn('animate-spin', sizes[size], colors[color], className)}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      'animate-pulse bg-slate-200 rounded',
      className
    )} />
  )
}