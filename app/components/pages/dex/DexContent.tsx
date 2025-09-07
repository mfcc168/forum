'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { SearchInput } from '@/app/components/shared/SearchInput'
import { Icon } from '@/app/components/ui/Icon'
import dynamic from 'next/dynamic'
import type { DexMonster, DexStats, DexCategory } from '@/lib/types'

// Dynamically import the 3D model viewer with lazy loading for better performance in lists
const LazyModelViewer = dynamic(() => import('@/app/components/dex/LazyModelViewer').then(mod => ({ default: mod.LazyModelViewer })), {
  ssr: false,
  loading: () => <ModelViewerSkeleton />
})

interface DexContentProps {
  initialMonsters: DexMonster[]
  initialCategories: DexCategory[]
  initialStats: DexStats
}

export function DexContent({ 
  initialMonsters,
  initialCategories,
  initialStats 
}: DexContentProps) {
  const { t, locale } = useTranslation()
  const { data: session } = useSession()
  const permissions = usePermissions(session, 'dex')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dynamic value translations for filters
  const isZhTW = locale === 'zh-TW'
  const getCategoryLabel = (category: string) => {
    if (!isZhTW) return category.charAt(0).toUpperCase() + category.slice(1)
    switch (category.toLowerCase()) {
      case 'hostile': return '敵對'
      case 'passive': return '被動'
      case 'neutral': return '中立'
      case 'boss': return '魔王'
      default: return category
    }
  }

  const allCategoriesLabel = isZhTW ? '所有分類' : 'All Categories'
  const searchPlaceholder = isZhTW ? '搜尋怪物...' : 'Search monsters...'
  const createMonsterLabel = isZhTW ? '新增怪物' : 'Create Monster'
  const showingLabel = isZhTW ? '顯示' : 'Showing'
  const ofLabel = isZhTW ? '共' : 'of'
  const monstersLabel = isZhTW ? '隻怪物' : 'monsters'
  const emptyTitle = isZhTW ? '找不到怪物' : 'No monsters found'
  const emptyDescription = isZhTW ? '請調整搜尋條件或篩選器以找到更多怪物。' : 'Try adjusting your search or filters to find more monsters.'

  // Filter monsters based on search and category
  const filteredMonsters = useMemo(() => {
    let filtered = initialMonsters

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(monster => monster.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(monster => 
        monster.name.toLowerCase().includes(query) ||
        monster.description.toLowerCase().includes(query) ||
        monster.behaviors.some(behavior => behavior.toLowerCase().includes(query)) ||
        monster.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [initialMonsters, selectedCategory, searchQuery])

  // Get unique categories from monsters
  const categories = useMemo(() => {
    const uniqueCategories = new Set(initialMonsters.map(monster => monster.category))
    return Array.from(uniqueCategories)
  }, [initialMonsters])

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="minecraft-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{allCategoriesLabel}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Create Monster Button (Admin Only) */}
          {permissions.canCreate && (
            <div>
              <Link
                href="/dex/create"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                {createMonsterLabel}
              </Link>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {showingLabel} {filteredMonsters.length} {ofLabel} {initialMonsters.length} {monstersLabel}
        </div>
      </div>

      {/* Monster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMonsters.map((monster) => (
          <MonsterCard key={monster.id} monster={monster} />
        ))}
      </div>

      {/* Empty State */}
      {filteredMonsters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {emptyTitle}
          </h3>
          <p className="text-gray-600">
            {emptyDescription}
          </p>
        </div>
      )}
    </div>
  )
}

interface MonsterCardProps {
  monster: DexMonster
}

function MonsterCard({ monster }: MonsterCardProps) {
  const { t, locale } = useTranslation()

  // Dynamic value translations for card
  const isZhTW = locale === 'zh-TW'
  const getCategoryLabel = (category: string) => {
    if (!isZhTW) return category.charAt(0).toUpperCase() + category.slice(1)
    switch (category.toLowerCase()) {
      case 'hostile': return '敵對'
      case 'passive': return '被動'
      case 'neutral': return '中立'
      case 'boss': return '魔王'
      default: return category
    }
  }

  return (
    <Link href={`/dex/${monster.slug}`} className="block">
      <div className="minecraft-card hover:shadow-lg transition-shadow duration-200 overflow-hidden group">
        {/* Monster 3D Model Preview */}
        <div className="aspect-square relative overflow-hidden">
          <LazyModelViewer 
            modelPath={monster.modelPath} 
            className="w-full h-full"
          />
          
          {/* Category badge */}
          <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
            {getCategoryLabel(monster.category)}
          </div>
        </div>

        {/* Monster Info */}
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {monster.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {monster.excerpt || monster.description}
          </p>

          {/* Spawning Info Preview */}
          {monster.spawning.worlds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {monster.spawning.worlds.slice(0, 2).map((world) => (
                <span key={world} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {world}
                </span>
              ))}
              {monster.spawning.worlds.length > 2 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  +{monster.spawning.worlds.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function ModelViewerSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Icon name="model3d" className="w-12 h-12 text-slate-400" />
        </div>
        <div className="text-slate-500 text-sm font-medium">Loading...</div>
      </div>
    </div>
  )
}