'use client';

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { Button } from '@/app/components/ui/Button'
import { Icon } from '@/app/components/ui/Icon'
import { HydrationCheck, useHydration } from '@/app/components/ui/HydrationCheck'
import { 
  useWikiGuides,
  useWikiStats, 
  useWikiSearch 
} from '@/lib/hooks/useWiki'
import { formatNumber } from '@/lib/utils'
import { ListRenderer } from '@/app/components/ui/StateRenderer'
import type { WikiGuide, WikiStats, WikiCategory } from '@/lib/types'

interface WikiContentProps {
  initialGuides?: WikiGuide[]
  initialCategories?: WikiCategory[]
  initialStats?: WikiStats
}

export function WikiContent({
  initialGuides = [],
  initialCategories = [],
  initialStats
}: WikiContentProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')
  const isHydrated = useHydration()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Ensure initial guides is always an array
  const safeInitialGuides = Array.isArray(initialGuides) ? initialGuides : []
  
  // Use centralized permission system (consistent with blog/forum pattern) - MOVED UP
  const permissions = usePermissions(session, 'wiki')
  
  // Use wiki hooks with initial data for hydration (consistent with blog/forum pattern)
  // Admins can see all guides, regular users only see published
  const wikiQuery = useWikiGuides({
    status: permissions.canViewDrafts ? undefined : 'published', // Admin sees all, users see only published
    initialData: safeInitialGuides
  })
  
  // Use initial data directly for SSR, fallback to query data
  const effectiveGuides = safeInitialGuides.length > 0 ? safeInitialGuides : (wikiQuery.data || [])

  const gettingStartedGuides = effectiveGuides.filter(guide => guide.category === 'getting-started').slice(0, 6)
  const gameplayGuides = effectiveGuides.filter(guide => guide.category === 'gameplay').slice(0, 6)
  const featuresGuides = effectiveGuides.filter(guide => guide.category === 'features').slice(0, 6)
  const communityGuides = effectiveGuides.filter(guide => guide.category === 'community').slice(0, 6)

  // Use stats with initial data for hydration (SSR consistency)
  const statsQuery = useWikiStats({
    initialData: initialStats
  })

  // Search functionality
  const searchResults = useWikiSearch(debouncedSearchQuery, { 
    enabled: !!debouncedSearchQuery 
  })

  // Helper to render guide cards
  const renderGuideCard = (guide: WikiGuide) => {
    if (!guide || !guide.slug) return null
    
    return (
      <Link 
        key={guide.id || guide.slug}
        href={`/wiki/${guide.slug}`}
        className="block p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-3">
            <h3 className="font-semibold text-slate-800 line-clamp-2">
              {guide.title}
            </h3>
            {/* Show status indicator for admins */}
            {permissions.canViewDrafts && guide.status !== 'published' && (
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                guide.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                guide.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {guide.status}
              </span>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
            guide.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
            guide.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {guide.difficulty}
          </span>
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
          {guide.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Icon name="eye" className="w-3 h-3" />
              <span>{formatNumber(guide.stats?.viewsCount || 0)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="thumbsUp" className="w-3 h-3" />
              <span>{guide.stats?.helpfulsCount || 0}</span>
            </span>
          </div>
          <span>{guide.estimatedTime || '10 min'}</span>
        </div>
      </Link>
    )
  }

  // Category section renderer (original design)
  const categoryInfo = {
    'getting-started': {
      title: t.wiki?.categories?.gettingStarted || 'Getting Started',
      description: t.wiki?.categories?.gettingStartedDesc || 'Essential guides for new players',
      icon: 'play',
      color: 'emerald' as const,
      guides: gettingStartedGuides,
      isLoading: wikiQuery.isLoading && !wikiQuery.data && safeInitialGuides.length === 0
    },
    'gameplay': {
      title: t.wiki?.categories?.gameplay || 'Gameplay',
      description: t.wiki?.categories?.gameplayDesc || 'Game mechanics and strategies',
      icon: 'gamepad',
      color: 'blue' as const,
      guides: gameplayGuides,
      isLoading: wikiQuery.isLoading && !wikiQuery.data && safeInitialGuides.length === 0
    },
    'features': {
      title: t.wiki?.categories?.features || 'Features',
      description: t.wiki?.categories?.featuresDesc || 'Server features and systems',
      icon: 'cog',
      color: 'purple' as const,
      guides: featuresGuides,
      isLoading: wikiQuery.isLoading && !wikiQuery.data && safeInitialGuides.length === 0
    },
    'community': {
      title: t.wiki?.categories?.community || 'Community',
      description: t.wiki?.categories?.communityDesc || 'Community guidelines and social features',
      icon: 'users',
      color: 'orange' as const,
      guides: communityGuides,
      isLoading: wikiQuery.isLoading && !wikiQuery.data && safeInitialGuides.length === 0
    }
  }

  const renderCategorySection = (categoryKey: keyof typeof categoryInfo) => {
    const category = categoryInfo[categoryKey]
    
    // Define explicit gradient classes for Tailwind compilation
    const gradientClasses = {
      emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-600'
    } as const
    
    return (
      <section key={categoryKey} className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl ${gradientClasses[category.color]} flex items-center justify-center`}>
              <Icon name={category.icon} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{category.title}</h2>
              <p className="text-slate-600">{category.description}</p>
            </div>
          </div>
          {!category.isLoading && category.guides.length > 0 && (
            <Link 
              href={`/wiki/category/${categoryKey}`}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
            >
              <span>{t.wiki?.viewAll || 'View all'}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </Link>
          )}
        </div>

        {category.isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 animate-pulse">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : category.guides.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <Icon name="document" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {t.wiki?.noGuidesYet || 'No guides yet'}
            </h3>
            <p className="text-slate-500">
              {t.wiki?.checkBackSoon || 'Check back soon for new guides in this category'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.guides.filter(guide => guide && guide.slug).map(renderGuideCard)}
          </div>
        )}
      </section>
    )
  }


  return (
    <div>
      {/* Search Section */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-8 mb-12">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <HydrationCheck>
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t.wiki?.searchPlaceholder || 'Search guides...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
              <Icon name="search" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </HydrationCheck>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Create Guide Button (consistent with blog/forum pattern) */}
        <HydrationCheck>
          {permissions.canCreate && (
            <div className="mb-6">
              <Link href="/wiki/create">
                <Button className="minecraft-button">
                  <Icon name="plus" className="w-4 h-4 mr-2" />
                  {t.wiki?.forms?.create?.submitButton || 'Create Wiki Guide'}
                </Button>
              </Link>
            </div>
          )}
        </HydrationCheck>

        {/* Search Results */}
        {debouncedSearchQuery && isHydrated && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {t.wiki?.searchResultsFor || 'Search Results for'} &ldquo;{debouncedSearchQuery}&rdquo;
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center space-x-1"
              >
                <Icon name="x" className="w-4 h-4" />
                <span>{t.wiki?.clearSearch || 'Clear search'}</span>
              </button>
            </div>
            
            <ListRenderer
              state={{
                data: searchResults.data || [],
                isLoading: searchResults.isLoading && !searchResults.data,
                error: searchResults.error,
                refetch: searchResults.refetch
              }}
              loading={{
                variant: 'skeleton',
                layout: 'grid',
                count: 6,
                message: 'Searching guides...'
              }}
              error={{
                variant: 'card',
                onRetry: searchResults.refetch,
                showReload: true
              }}
              empty={{
                title: t.wiki?.noGuidesFound || 'No guides found for',
                description: `${t.wiki?.searchSuggestion || 'Try different keywords or browse categories below'} "${debouncedSearchQuery}"`,
                icon: 'search',
                variant: 'card',
              }}
            >
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(searchResults.data || []).filter(guide => guide && guide.id && guide.slug).map(renderGuideCard)}
              </div>
            </ListRenderer>
          </div>
        )}

        {/* Category Sections (original design) */}
        {!debouncedSearchQuery && (
          <div>
            {(Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>).map(renderCategorySection)}
          </div>
        )}

        {/* Footer Actions */}
        <HydrationCheck>
          {!session && (
            <div className="mt-16 text-center bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8">
              <div className="max-w-2xl mx-auto">
                <Icon name="users" className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">{t.auth?.joinCommunity || 'Join Our Community'}</h3>
                <p className="text-slate-600 mb-6">
                  {t.wiki?.joinDescription || 'Sign in to contribute guides, ask questions, and help other players on their journey'}
                </p>
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                    {t.wiki?.signInToContribute || 'Sign In to Contribute'}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </HydrationCheck>
      </div>
    </div>
  )
}