'use client'

import { useState, useMemo } from 'react'
import { Icon } from '@/app/components/ui/Icon'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Skeleton } from '@/app/components/ui/LoadingSpinner'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// Use existing hooks - no new complexity!
import { useBlogPosts } from '@/lib/hooks/useBlog'
import { useWikiGuides } from '@/lib/hooks/useWiki'
import { useForumPosts } from '@/lib/hooks/useForum'
import { useDexMonsters } from '@/lib/hooks/useDex'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

type SearchTab = 'all' | 'blog' | 'wiki' | 'forum' | 'dex'

interface SearchResult {
  id: string
  title: string
  excerpt: string
  module: string
  type: string
  slug: string
  url: string
  author: { name: string; avatar?: string }
  stats: { viewsCount: number; likesCount: number }
  createdAt: string
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')

  // Use existing module hooks - they already have search functionality!
  const blogResults = useBlogPosts({ 
    search: query, 
    limit: 10,
    enabled: query.length >= 2 
  })
  
  const wikiResults = useWikiGuides({ 
    search: query, 
    limit: 10,
    enabled: query.length >= 2 
  })
  
  const forumResults = useForumPosts({ 
    search: query, 
    limit: 10,
    enabled: query.length >= 2 
  })
  
  const dexResults = useDexMonsters({ 
    search: query, 
    limit: 10,
    enabled: query.length >= 2 
  })

  // Transform results to common format
  const transformedResults = useMemo(() => {
    const results: SearchResult[] = []

    // Blog posts
    if (blogResults.data) {
      results.push(...blogResults.data.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        module: 'blog',
        type: 'post',
        slug: post.slug,
        url: `/blog/${post.slug}`,
        author: post.author,
        stats: post.stats,
        createdAt: post.createdAt
      })))
    }

    // Wiki guides
    if (wikiResults.data) {
      results.push(...wikiResults.data.map(guide => ({
        id: guide.id,
        title: guide.title,
        excerpt: guide.excerpt,
        module: 'wiki',
        type: 'guide',
        slug: guide.slug,
        url: `/wiki/${guide.slug}`,
        author: guide.author,
        stats: guide.stats,
        createdAt: guide.createdAt
      })))
    }

    // Forum posts
    if (forumResults.data) {
      results.push(...forumResults.data.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        module: 'forum',
        type: 'post',
        slug: post.slug,
        url: `/forum/${post.slug}`,
        author: post.author,
        stats: post.stats,
        createdAt: post.createdAt
      })))
    }

    // Dex monsters
    if (dexResults.data) {
      results.push(...dexResults.data.map(monster => ({
        id: monster.id,
        title: monster.name,
        excerpt: monster.description,
        module: 'dex',
        type: 'monster',
        slug: monster.slug,
        url: `/dex/${monster.slug}`,
        author: monster.author,
        stats: monster.stats,
        createdAt: monster.createdAt
      })))
    }

    return results
  }, [blogResults.data, wikiResults.data, forumResults.data, dexResults.data])

  // Filter results by active tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return transformedResults
    return transformedResults.filter(result => result.module === activeTab)
  }, [transformedResults, activeTab])

  const isLoading = blogResults.isLoading || wikiResults.isLoading || forumResults.isLoading || dexResults.isLoading
  const hasResults = filteredResults.length > 0
  const showResults = query.length >= 2

  const tabs = [
    { key: 'all', label: 'All', count: transformedResults.length },
    { key: 'blog', label: 'Blog', count: transformedResults.filter(r => r.module === 'blog').length },
    { key: 'wiki', label: 'Wiki', count: transformedResults.filter(r => r.module === 'wiki').length },
    { key: 'forum', label: 'Forum', count: transformedResults.filter(r => r.module === 'forum').length },
    { key: 'dex', label: 'Dex', count: transformedResults.filter(r => r.module === 'dex').length }
  ] as const

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Search</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <Icon name="x" className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all content..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {showResults && (
          <>
            {/* Tabs */}
            <div className="px-6 py-4 border-b bg-slate-50">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as SearchTab)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label} {tab.count > 0 && <span className="ml-1 text-xs">({tab.count})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : hasResults ? (
                <div className="p-6 space-y-4">
                  {filteredResults.map((result) => (
                    <Link
                      key={`${result.module}-${result.id}`}
                      href={result.url}
                      onClick={onClose}
                      className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              result.module === 'blog' ? 'bg-blue-100 text-blue-800' :
                              result.module === 'wiki' ? 'bg-green-100 text-green-800' :
                              result.module === 'forum' ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {result.module}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">{result.type}</span>
                          </div>
                          <h3 className="font-semibold text-slate-800 truncate">{result.title}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{result.excerpt}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span>by {result.author.name}</span>
                            <span className="flex items-center space-x-1">
                              <Icon name="eye" className="w-3 h-3" />
                              <span>{result.stats.viewsCount}</span>
                            </span>
                            <span>{formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <Icon name="search" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No results found for &ldquo;{query}&rdquo;</p>
                  <p className="text-sm mt-1">Try different keywords or check your spelling</p>
                </div>
              )}
            </div>
          </>
        )}

        {!showResults && (
          <div className="p-6 text-center text-slate-500">
            <Icon name="search" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Start typing to search...</p>
            <p className="text-sm mt-1">Search across blog posts, wiki guides, forum discussions, and monster dex</p>
          </div>
        )}
      </Card>
    </div>
  )
}