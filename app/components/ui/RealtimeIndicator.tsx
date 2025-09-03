/**
 * Real-time connection indicator for WebSocket stats
 */
'use client'

import { memo } from 'react'
import { Icon } from '@/app/components/ui/Icon'

interface RealtimeIndicatorProps {
  isConnected: boolean
  lastUpdate?: number
  compact?: boolean
  className?: string
}

export const RealtimeIndicator = memo(function RealtimeIndicator({
  isConnected,
  lastUpdate,
  compact = false,
  className = ''
}: RealtimeIndicatorProps) {
  if (!isConnected) {
    return null // Don't show indicator when not connected
  }

  const timeSinceUpdate = lastUpdate ? Date.now() - lastUpdate : null
  const isRecentUpdate = timeSinceUpdate !== null && timeSinceUpdate < 5000 // 5 seconds

  return (
    <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'} ${className}`}>
      <div className="relative">
        <Icon 
          name="wifi" 
          className={`w-3 h-3 ${
            isRecentUpdate 
              ? 'text-green-500 animate-pulse' 
              : 'text-green-400'
          }`} 
        />
        {isRecentUpdate && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping" />
        )}
      </div>
      
      {!compact && (
        <span className={`text-xs font-medium ${
          isRecentUpdate ? 'text-green-600' : 'text-green-500'
        }`}>
          {isRecentUpdate ? 'Live Update' : 'Live'}
        </span>
      )}
    </div>
  )
})