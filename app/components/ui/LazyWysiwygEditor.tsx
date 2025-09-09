'use client'

import { Suspense, lazy } from 'react'
import type { WysiwygEditorProps } from '@/lib/types'

// Lazy load the WysiwygEditor component (TipTap is ~80KB)
const WysiwygEditor = lazy(() =>
  import('./WysiwygEditor').then((mod) => ({ default: mod.WysiwygEditor }))
)

// Loading fallback component
function EditorSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-slate-300 rounded-md ${className}`}>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
        <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <div className="h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
        <div className="w-px h-6 bg-slate-300 mx-1"></div>
        <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
      </div>
      
      {/* Content area skeleton */}
      <div className="p-3 space-y-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
        <div className="h-32 bg-slate-100 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

export function LazyWysiwygEditor(props: WysiwygEditorProps) {
  return (
    <Suspense fallback={<EditorSkeleton className={props.className} />}>
      <WysiwygEditor {...props} />
    </Suspense>
  )
}

export default LazyWysiwygEditor