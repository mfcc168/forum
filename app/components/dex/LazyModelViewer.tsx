'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ModelViewer } from './ModelViewer'
import { Icon } from '@/app/components/ui/Icon'

interface LazyModelViewerProps {
  modelPath: string
  className?: string
  modelScale?: number
  cameraPosition?: { x: number; y: number; z: number }
  cameraLookAt?: { x: number; y: number; z: number }
  editMode?: boolean
  onValuesChange?: (values: {
    modelScale: number
    cameraPosition: { x: number; y: number; z: number }
    cameraLookAt: { x: number; y: number; z: number }
  }) => void
}

export function LazyModelViewer({ 
  modelPath, 
  className = '', 
  modelScale, 
  cameraPosition, 
  cameraLookAt,
  editMode,
  onValuesChange
}: LazyModelViewerProps) {
  const [isInView, setIsInView] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsInView(true)
          setHasLoaded(true) // Only load once
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // Start loading when the element is 50px away from being visible
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [hasLoaded])

  // In edit mode, immediately show the ModelViewer without waiting for intersection
  const shouldShowModelViewer = editMode || isInView

  return (
    <div ref={containerRef} className={className}>
      {shouldShowModelViewer ? (
        <ModelViewer 
          modelPath={modelPath} 
          className="w-full h-full"
          modelScale={modelScale}
          cameraPosition={cameraPosition}
          cameraLookAt={cameraLookAt}
          editMode={editMode}
          onValuesChange={onValuesChange}
        />
      ) : (
        <LazyModelViewerSkeleton />
      )}
    </div>
  )
}

function LazyModelViewerSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Icon name="model3d" className="w-12 h-12 text-slate-400 animate-pulse" />
        </div>
        <div className="text-slate-500 text-sm font-medium">Loading 3D Model...</div>
      </div>
    </div>
  )
}