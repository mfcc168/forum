'use client'

import { useMemo, useState, useEffect, useRef, useCallback, ReactElement, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[]
  
  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactElement
  
  /** Estimated height of each item in pixels */
  itemHeight: number
  
  /** Height of the visible container */
  containerHeight: number
  
  /** Number of items to render outside the visible area (buffer) */
  overscan?: number
  
  /** Custom className for the container */
  className?: string
  
  /** Loading component to show at the end */
  loadingComponent?: ReactNode
  
  /** Whether more items are being loaded */
  isLoading?: boolean
  
  /** Callback when user scrolls near the end (infinite scroll) */
  onLoadMore?: () => void
  
  /** Threshold for triggering onLoadMore (pixels from bottom) */
  loadMoreThreshold?: number
  
  /** Key extractor for stable item keys */
  getItemKey: (item: T, index: number) => string | number
  
  /** Custom gap between items */
  gap?: number
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
  loadingComponent,
  isLoading = false,
  onLoadMore,
  loadMoreThreshold = 200,
  getItemKey,
  gap = 0
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate total height with gaps
  const totalItemHeight = itemHeight + gap
  const totalHeight = items.length * totalItemHeight - gap // Remove gap after last item
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / totalItemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / totalItemHeight),
      items.length - 1
    )
    
    // Add overscan
    const overscanStart = Math.max(startIndex - overscan, 0)
    const overscanEnd = Math.min(endIndex + overscan, items.length - 1)
    
    return {
      start: overscanStart,
      end: overscanEnd
    }
  }, [scrollTop, containerHeight, totalItemHeight, items.length, overscan])
  
  // Generate visible items
  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i]
      if (item) {
        result.push({
          index: i,
          item,
          offsetY: i * totalItemHeight
        })
      }
    }
    return result
  }, [items, visibleRange, totalItemHeight])
  
  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: `${loadMoreThreshold}px`
  })
  
  // Trigger load more when in view
  useEffect(() => {
    if (inView && onLoadMore && !isLoading) {
      onLoadMore()
    }
  }, [inView, onLoadMore, isLoading])
  
  // If list is small, render normally (no virtualization overhead)
  if (items.length <= 50) {
    return (
      <div className={`space-y-${gap ? Math.floor(gap / 4) : 4} ${className}`}>
        {items.map((item, index) => (
          <div key={getItemKey(item, index)}>
            {renderItem(item, index)}
          </div>
        ))}
        {isLoading && loadingComponent}
      </div>
    )
  }
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total container with correct height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Render visible items */}
        {visibleItems.map(({ item, index, offsetY }) => (
          <div
            key={getItemKey(item, index)}
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      {/* Load more trigger */}
      {onLoadMore && (
        <div 
          ref={loadMoreRef}
          style={{ 
            position: 'absolute', 
            bottom: loadMoreThreshold,
            height: 1,
            width: '100%'
          }}
        />
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="p-4 flex justify-center">
          {loadingComponent}
        </div>
      )}
    </div>
  )
}

export default VirtualizedList