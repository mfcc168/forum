'use client';

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { Button } from '@/app/components/ui/Button'
import { Icon } from '@/app/components/ui/Icon'
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner'
import { HydrationCheck, useHydration } from '@/app/components/ui/HydrationCheck'
import { useWikiGuides } from '@/lib/hooks/useWiki'
import type { WikiGuide } from '@/lib/types'
import type { WikiStats } from '@/lib/schemas/wiki'

interface WikiContentProps {
  initialGettingStartedGuides: WikiGuide[]
  initialGameplayGuides: WikiGuide[]
  initialFeaturesGuides: WikiGuide[]
  initialCommunityGuides: WikiGuide[]
  initialStats?: WikiStats
}

export default function WikiContent({
  initialGettingStartedGuides,
  initialGameplayGuides,
  initialFeaturesGuides,
  initialCommunityGuides,
  initialStats
}: WikiContentProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const permissions = usePermissions(session, 'wiki')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')
  const isHydrated = useHydration()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search across all guides when there's a search query
  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError
  } = useWikiGuides({
    search: debouncedSearchQuery || undefined,
    status: 'published',
    limit: 50
  })

  // Category data with icons and descriptions (i18n)
  const categoryInfo = {
    'getting-started': {
      title: t.wiki?.sections?.gettingStarted || 'Getting Started',
      description: t.wiki?.descriptions?.gettingStarted || 'Essential guides for new players to begin their journey',
      icon: 'user-plus',
      color: 'emerald',
      guides: initialGettingStartedGuides
    },
    'gameplay': {
      title: t.wiki?.sections?.gameplay || 'Gameplay',
      description: t.wiki?.descriptions?.gameplay || 'Core mechanics, systems, and gameplay features',
      icon: 'gamepad-2',
      color: 'blue',
      guides: initialGameplayGuides
    },
    'features': {
      title: t.wiki?.sections?.features || 'Features',
      description: t.wiki?.descriptions?.features || 'Special server features and unique content',
      icon: 'sparkles',
      color: 'purple',
      guides: initialFeaturesGuides
    },
    'community': {
      title: t.wiki?.sections?.community || 'Community',
      description: t.wiki?.descriptions?.community || 'Social features, events, and community guidelines',
      icon: 'users',
      color: 'orange',
      guides: initialCommunityGuides
    }
  } as const

  // Helper function to render guide cards with language support
  const renderGuideCard = (guide: WikiGuide) => {
    // Content is stored as a simple string (not multilingual object)
    const content = guide.content ? {
      title: guide.title,
      excerpt: guide.excerpt
    } : null
    const title = content?.title || guide.slug
    const excerpt = content?.excerpt || t.wiki?.noDescription || 'No description available'
    
    // Translate difficulty
    const difficultyLabel = guide.difficulty === 'beginner' ? 
      (t.wiki?.difficulty?.beginner || 'Beginner') :
      guide.difficulty === 'intermediate' ?
      (t.wiki?.difficulty?.intermediate || 'Intermediate') :
      (t.wiki?.difficulty?.advanced || 'Advanced')
    
    return (
      <Link key={guide.id} href={`/wiki/${guide.slug}`}>
        <div className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
              {title}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              guide.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
              guide.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {difficultyLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center">
              <Icon name="clock" className="w-3 h-3 mr-1" />
              {guide.estimatedTime}
            </span>
            <span className="flex items-center">
              <Icon name="eye" className="w-3 h-3 mr-1" />
              {guide.stats?.viewsCount || 0} {t.wiki?.views || 'views'}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Helper function to render category section
  const renderCategorySection = (categoryKey: keyof typeof categoryInfo) => {
    const category = categoryInfo[categoryKey]
    
    return (
      <section key={categoryKey} className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${category.color}-500 to-${category.color}-600 flex items-center justify-center`}>
              <Icon name={category.icon} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{category.title}</h2>
              <p className="text-slate-600">{category.description}</p>
            </div>
          </div>
          {category.guides.length > 0 && (
            <Link 
              href={`/wiki/category/${categoryKey}`}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1"
            >
              <span>{t.wiki?.viewAll || 'View all'}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </Link>
          )}
        </div>

        {category.guides.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.guides.slice(0, 6).map(renderGuideCard)}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <Icon name="book-open" className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">{t.wiki?.noGuidesInCategory || 'No guides available in this category yet'}</p>
            {permissions.canCreate && (
              <Link href="/wiki/create">
                <Button className="mt-3" size="sm">
                  {t.wiki?.createFirstGuide || 'Create the first guide'}
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Icon name="book-open" className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">{t.wiki?.title || 'Server Wiki'}</h1>
            </div>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              {t.wiki?.subtitle || 'Your complete guide to everything on our Minecraft server. From basic commands to advanced features.'}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-8">
              <div className="relative">
                <Icon name="search" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.wiki?.searchPlaceholder || 'Search the wiki...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
                  >
                    <Icon name="x" className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {initialStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{initialStats.totalGuides}</div>
                  <div className="text-sm text-emerald-100">{t.wiki?.stats?.guides || 'Guides'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{initialStats.totalViews?.toLocaleString() || 0}</div>
                  <div className="text-sm text-emerald-100">{t.wiki?.stats?.views || 'Views'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{initialStats.totalUsers || 0}</div>
                  <div className="text-sm text-emerald-100">{t.wiki?.stats?.authors || 'Authors'}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-sm text-emerald-100">{t.wiki?.stats?.categories || 'Categories'}</div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <HydrationCheck>
              {permissions.canCreate && (
                <div className="mt-6">
                  <Link href="/wiki/create">
                    <Button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white">
                      <Icon name="plus" className="w-4 h-4 mr-2" />
                      {t.wiki?.createNewGuide || 'Create New Guide'}
                    </Button>
                  </Link>
                </div>
              )}
            </HydrationCheck>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
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
            
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : searchError ? (
              <div className="text-center py-8 bg-red-50 rounded-xl">
                <Icon name="alert-circle" className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600">{t.wiki?.searchError || 'Failed to search guides'}</p>
              </div>
            ) : searchData && searchData.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchData.map(renderGuideCard)}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <Icon name="search" className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">{t.wiki?.noGuidesFound || 'No guides found for'} &ldquo;{debouncedSearchQuery}&rdquo;</p>
                <p className="text-sm text-slate-500 mt-1">{t.wiki?.searchSuggestion || 'Try different keywords or browse categories below'}</p>
              </div>
            )}
          </div>
        )}

        {/* Category Sections */}
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