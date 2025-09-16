'use client'

import React, { memo, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Icon } from '@/app/components/ui/Icon'
import { useWikiGuideInteraction } from '@/lib/hooks/useWiki'
import { formatDistanceToNow } from 'date-fns'
import type { WikiGuide } from '@/lib/types'

interface WikiGuideCardProps {
  guide: WikiGuide
  showCategory?: boolean
  layout?: 'card' | 'list'
}

export const WikiGuideCard = memo(function WikiGuideCard({ 
  guide, 
  showCategory = true,
  layout = 'card'
}: WikiGuideCardProps) {
  const { data: session } = useSession()
  const interactionMutation = useWikiGuideInteraction()

  const handleInteraction = useCallback(async (
    e: React.MouseEvent,
    action: 'like' | 'bookmark' | 'helpful'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!session) {
      // Could show login modal or redirect
      return
    }

    try {
      await interactionMutation.mutateAsync({
        slug: guide.slug,
        action
      })
    } catch (error) {
      console.error('Failed to record interaction:', error)
    }
  }, [guide.slug, session, interactionMutation])

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    advanced: 'bg-red-100 text-red-800 border-red-200'
  }

  const categoryColors = {
    'getting-started': 'bg-emerald-100 text-emerald-800',
    'gameplay': 'bg-blue-100 text-blue-800',
    'features': 'bg-purple-100 text-purple-800',
    'community': 'bg-orange-100 text-orange-800'
  }

  const categoryNames = {
    'getting-started': 'Getting Started',
    'gameplay': 'Gameplay',
    'features': 'Features', 
    'community': 'Community'
  }

  if (layout === 'list') {
    return (
      <Link href={`/wiki/${guide.slug}`}>
        <div className="minecraft-card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {/* Icon removed - not part of WikiGuide interface */}
                <h3 className="text-lg font-semibold text-slate-800 truncate">
                  {guide.title}
                </h3>
                <span 
                  className={`px-2 py-1 rounded text-xs border ${difficultyColors[guide.difficulty]} flex-shrink-0`}
                >
                  {guide.difficulty}
                </span>
              </div>
              
              <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                {guide.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {showCategory && (
                    <span className={`px-2 py-1 rounded-full ${categoryColors[guide.category]}`}>
                      {categoryNames[guide.category]}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Icon name="eye" className="w-3 h-3" />
                    {guide.stats?.viewsCount || 0}
                  </span>
                  {guide.estimatedTime && (
                    <span className="flex items-center gap-1">
                      <Icon name="clock" className="w-3 h-3" />
                      {guide.estimatedTime}
                    </span>
                  )}
                  <span>
                    by {guide.author.name}
                  </span>
                </div>
                
                {session && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleInteraction(e, 'like')}
                      className={`p-1 rounded transition-colors ${
                        guide.interactions?.isLiked 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-slate-400 hover:text-red-500'
                      }`}
                      disabled={interactionMutation.isPending}
                    >
                      <Icon name="heart" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleInteraction(e, 'bookmark')}
                      className={`p-1 rounded transition-colors ${
                        guide.interactions?.isBookmarked 
                          ? 'text-blue-500 hover:text-blue-600' 
                          : 'text-slate-400 hover:text-blue-500'
                      }`}
                      disabled={interactionMutation.isPending}
                    >
                      <Icon name="bookmark" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Card layout
  return (
    <Link href={`/wiki/${guide.slug}`}>
      <div className="minecraft-card p-6 h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Icon removed - not part of WikiGuide interface */}
              <h3 className="text-lg font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {guide.title}
              </h3>
            </div>
            <span 
              className={`px-2 py-1 rounded text-xs border ${difficultyColors[guide.difficulty]} ml-2 flex-shrink-0`}
            >
              {guide.difficulty}
            </span>
          </div>
          
          {/* Content */}
          <p className="text-slate-600 text-sm mb-4 flex-1 line-clamp-3">
            {guide.excerpt}
          </p>
          
          {/* Tags */}
          {guide.tags && guide.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {guide.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={`${tag}-${index}`}
                  className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {guide.tags.length > 3 && (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full">
                  +{guide.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {showCategory && (
                <span className={`px-2 py-1 rounded-full ${categoryColors[guide.category]}`}>
                  {categoryNames[guide.category]}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Icon name="eye" className="w-3 h-3" />
                {guide.stats?.viewsCount || 0}
              </span>
              {guide.estimatedTime && (
                <span className="flex items-center gap-1">
                  <Icon name="clock" className="w-3 h-3" />
                  {guide.estimatedTime}
                </span>
              )}
            </div>
            
            {session && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleInteraction(e, 'like')}
                  className={`p-1 rounded transition-colors ${
                    guide.interactions?.isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-slate-400 hover:text-red-500'
                  }`}
                  disabled={interactionMutation.isPending}
                  title={guide.interactions?.isLiked ? 'Unlike' : 'Like'}
                >
                  <Icon name="heart" className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleInteraction(e, 'bookmark')}
                  className={`p-1 rounded transition-colors ${
                    guide.interactions?.isBookmarked 
                      ? 'text-blue-500 hover:text-blue-600' 
                      : 'text-slate-400 hover:text-blue-500'
                  }`}
                  disabled={interactionMutation.isPending}
                  title={guide.interactions?.isBookmarked ? 'Unsave' : 'Save'}
                >
                  <Icon name="bookmark" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Author info */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {guide.author.avatar && (
                <img 
                  src={guide.author.avatar} 
                  alt={guide.author.name}
                  className="w-4 h-4 rounded-full"
                />
              )}
              <span>by {guide.author.name}</span>
            </div>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(guide.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
})

WikiGuideCard.displayName = 'WikiGuideCard'