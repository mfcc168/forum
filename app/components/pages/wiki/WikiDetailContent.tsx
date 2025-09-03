'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/app/components/ui/Icon'
import { Card } from '@/app/components/ui/Card'
import { Badge } from '@/app/components/ui/Badge'
import { useWikiGuide } from '@/lib/hooks/useWiki'
import { formatDistanceToNow } from 'date-fns'
import { WikiActions } from '@/app/components/wiki/WikiActions'
import { marked } from 'marked'
import { useContentRealtimeStats } from '@/lib/hooks/useRealtimeStats'
import type { WikiGuide } from '@/lib/types'

interface WikiDetailContentProps {
  slug: string
  initialGuide?: WikiGuide
}

const WikiDetailContent = memo(function WikiDetailContent({ slug, initialGuide }: WikiDetailContentProps) {
  const [activeHeading, setActiveHeading] = useState<string>('')
  
  // Use React Query with initial data for hydration
  // Force refetch on client to ensure authenticated interactions are included
  const guideQuery = useWikiGuide(slug, { 
    enabled: !!slug,
    initialData: initialGuide,
    // Force refetch on mount to get authenticated interaction states
    refetchOnMount: true,
    // Keep initialData but mark it as stale to trigger refetch
    staleTime: 0
  })
  
  // Prioritize fresh query data with interactions over SSR data without interactions
  const currentGuide = guideQuery.data || initialGuide

  // Subscribe to real-time stats updates for this guide
  const realtimeStats = useContentRealtimeStats('wiki', currentGuide?.id || '', {
    enabled: !!currentGuide?.id,
    debug: process.env.NODE_ENV === 'development'
  })

  // Get content - stored as simple markdown string, convert to HTML
  const currentContent = React.useMemo(() => {
    if (!currentGuide?.content) return null
    
    // Content is stored as simple markdown string - convert to HTML
    const markdownContent = typeof currentGuide?.content === 'string' ? currentGuide?.content : ''
    const htmlContent = markdownContent ? String(marked.parse(markdownContent)) : ''
    
    return {
      title: currentGuide?.title || 'Untitled',
      excerpt: currentGuide?.excerpt || '',
      content: htmlContent,
      plainText: markdownContent.replace(/[#*`]/g, '').replace(/\n+/g, ' ').trim() || ''
    }
  }, [currentGuide?.content, currentGuide?.title, currentGuide?.excerpt])
  
  const title = currentContent?.title || currentGuide?.title || 'Untitled'
  const excerpt = currentContent?.excerpt || currentGuide?.excerpt || ''
  const content = currentContent?.content || ''

  // Extract headings from HTML content for table of contents
  const headings = useMemo(() => {
    if (!content || typeof content !== 'string') return []
    
    // Simple regex to extract headings - in a real app you might use a HTML parser
    const headingMatches = content.match(/<h[2-6][^>]*>.*?<\/h[2-6]>/gi) || []
    return headingMatches.map((heading: string, index: number) => {
      const text = heading.replace(/<[^>]*>/g, '').trim()
      const level = parseInt(heading.match(/<h([2-6])/)?.[1] || '2')
      const id = `heading-${index}`
      return { text, level, id }
    })
  }, [content])


  // Memoize utility functions
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const categoryColors = useMemo(() => ({
    'getting-started': 'bg-emerald-100 text-emerald-800',
    'gameplay': 'bg-blue-100 text-blue-800',
    'features': 'bg-purple-100 text-purple-800',
    'community': 'bg-orange-100 text-orange-800',
  } as const), [])

  const categoryNames = useMemo(() => ({
    'getting-started': 'Getting Started',
    'gameplay': 'Gameplay',
    'features': 'Features',
    'community': 'Community',
  } as const), [])

  // Don't render if currentGuide is null/undefined (consistent with blog pattern)
  if (!currentGuide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <Icon name="book" className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Wiki guide not found</h1>
            <p className="text-slate-600 mb-4">The guide you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/wiki" className="text-emerald-600 hover:text-emerald-700">← Back to Wiki</Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
            <Link href="/wiki" className="hover:text-emerald-600 transition-colors">
              <Icon name="book" className="w-4 h-4 inline mr-1" />
              Wiki
            </Link>
            <Icon name="chevron-right" className="w-4 h-4" />
            <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[currentGuide!.category as keyof typeof categoryColors] || 'bg-slate-100 text-slate-800'}`}>
              {categoryNames[currentGuide!.category as keyof typeof categoryNames] || currentGuide!.category}
            </span>
            <Icon name="chevron-right" className="w-4 h-4" />
            <span className="text-slate-800 font-medium">
              {title}
            </span>
          </div>

          {/* Guide Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white p-8 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">
                      {title}
                    </h1>
                    <p className="text-emerald-100 mt-1">{excerpt}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Icon name="calendar" className="w-4 h-4" />
                    <span>Updated {currentGuide?.updatedAt ? formatDistanceToNow(new Date(currentGuide.updatedAt), { addSuffix: true }) : 'Unknown'}</span>
                  </div>
                  <Badge className={`${getDifficultyColor(currentGuide?.difficulty || 'beginner')} border`}>
                    {currentGuide?.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Icon name="eye" className="w-4 h-4" />
                    <span>{currentGuide?.stats?.viewsCount || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="thumbsUp" className="w-4 h-4" />
                    <span>{currentGuide?.stats?.helpfulsCount || 0} helpful</span>
                  </div>
                </div>
              </div>
              
              {/* Standardized Action Buttons */}
              <div className="ml-4 flex items-center space-x-3">
                <WikiActions guide={currentGuide} compact />
                
                {/* Real-time indicator */}
                {realtimeStats.isConnected && (
                  <div className="flex items-center space-x-1 text-xs text-green-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                  <Icon name="list" className="w-4 h-4 mr-2" />
                  Table of Contents
                </h3>
                {headings.length > 0 ? (
                  <nav className="space-y-2">
                    {headings.map((heading: { text: string; level: number; id: string }, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          const element = document.getElementById(heading.id)
                          element?.scrollIntoView({ behavior: 'smooth' })
                          setActiveHeading(heading.id)
                        }}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                          activeHeading === heading.id
                            ? 'bg-emerald-100 text-emerald-800 font-medium'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        style={{ paddingLeft: `${(heading.level - 2) * 12 + 8}px` }}
                      >
                        {heading.text}
                      </button>
                    ))}
                  </nav>
                ) : (
                  <p className="text-sm text-slate-500">No headings found</p>
                )}
                
                {/* Author Info */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3">Author</h4>
                  <div className="flex items-center space-x-3">
                    {currentGuide?.author?.avatar && (
                      <Image 
                        src={currentGuide?.author?.avatar} 
                        alt={currentGuide?.author?.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{currentGuide?.author?.name}</p>
                      <p className="text-xs text-slate-500">
                        Created {currentGuide?.createdAt ? formatDistanceToNow(new Date(currentGuide.createdAt), { addSuffix: true }) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                {currentGuide?.tags && currentGuide?.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentGuide?.tags.map((tag: string, index: number) => (
                        <span 
                          key={`${tag}-${index}`}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="p-8">
                {/* Content */}
                <div 
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </Card>

              {/* Standardized Actions Footer */}
              <Card className="p-6 mt-6">
                <h3 className="font-semibold text-slate-800 mb-4">Was this guide helpful?</h3>
                <WikiActions guide={currentGuide} showLabels />
              </Card>

              {/* Navigation Footer */}
              <div className="mt-8 flex justify-between items-center">
                <Link 
                  href="/wiki"
                  className="flex items-center space-x-2 text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  <Icon name="arrow-left" className="w-4 h-4" />
                  <span>Back to Wiki</span>
                </Link>
                
                <div className="text-sm text-slate-500">
                  Last updated {currentGuide?.updatedAt ? formatDistanceToNow(new Date(currentGuide.updatedAt), { addSuffix: true }) : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
})

export { WikiDetailContent }