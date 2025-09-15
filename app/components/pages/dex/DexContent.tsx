'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { SearchInput } from '@/app/components/shared/SearchInput'
import { ClientSearchFilter } from '@/app/components/shared/ClientSearchFilter'
import { Icon } from '@/app/components/ui/Icon'
import dynamic from 'next/dynamic'
import type { DexMonster, DexStats, DexCategory } from '@/lib/types'
import { useDexMonsters } from '@/lib/hooks/useDex'

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
  initialMonsters
}: DexContentProps) {
  const { t, locale } = useTranslation()
  const { data: session } = useSession()
  const permissions = usePermissions(session, 'dex')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedElement, setSelectedElement] = useState<string>('all')
  const [selectedRace, setSelectedRace] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Use hooks as fallback when initial data is empty or for real-time updates
  const { data: hookMonsters, isLoading } = useDexMonsters({
    enabled: !initialMonsters || initialMonsters.length === 0,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    element: selectedElement !== 'all' ? selectedElement as 'none' | 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark' | 'ice' | 'lightning' : undefined,
    race: selectedRace !== 'all' ? selectedRace as 'god' | 'dragon' | 'goblin' | 'orc' | 'elf' | 'dwarf' | 'troll' | 'giant' | 'undead' | 'skeleton' | 'zombie' | 'vampire' | 'ghost' | 'demon' | 'angel' | 'fairy' | 'phoenix' | 'beast' | 'wolf' | 'bear' | 'cat' | 'bird' | 'fish' | 'snake' | 'spider' | 'insect' | 'slime' | 'golem' | 'construct' | 'robot' | 'elemental' | 'plant' | 'humanoid' | 'alien' | 'void' : undefined,
    search: searchQuery || undefined,
    sortBy: 'latest'
  })

  // Use hook data if initial data is empty, otherwise use initial data
  const monsters = useMemo(() => {
    return initialMonsters && initialMonsters.length > 0 
      ? initialMonsters 
      : hookMonsters || []
  }, [initialMonsters, hookMonsters])

  // Dynamic value translations for filters
  const isZhTW = locale === 'zh-TW'
  const getCategoryLabel = (category: string) => {
    return t.dex?.categories?.[category as keyof typeof t.dex.categories] || 
           (category.charAt(0).toUpperCase() + category.slice(1))
  }

  const getElementLabel = (element: string) => {
    return t.dex?.elements?.[element as keyof typeof t.dex.elements] || 
           (element.charAt(0).toUpperCase() + element.slice(1))
  }

  const getRaceLabel = (race: string) => {
    return t.dex?.races?.[race as keyof typeof t.dex.races] || 
           (race.charAt(0).toUpperCase() + race.slice(1))
  }

  const allCategoriesLabel = t.dex?.filters?.allCategories || (isZhTW ? '所有分類' : 'All Categories')
  const allElementsLabel = isZhTW ? '所有元素' : 'All Elements'
  const allRacesLabel = isZhTW ? '所有種族' : 'All Races'
  const searchPlaceholder = t.dex?.search?.placeholder || (isZhTW ? '搜尋怪物...' : 'Search monsters...')
  const createMonsterLabel = isZhTW ? '新增怪物' : 'Create Monster'
  const showingLabel = t.dex?.results?.showing || (isZhTW ? '顯示' : 'Showing')
  const ofLabel = t.dex?.results?.of || (isZhTW ? '共' : 'of')
  const monstersLabel = t.dex?.results?.monsters || (isZhTW ? '隻怪物' : 'monsters')
  const emptyTitle = t.dex?.empty?.title || (isZhTW ? '找不到怪物' : 'No monsters found')
  const emptyDescription = t.dex?.empty?.description || (isZhTW ? '請調整搜尋條件或篩選器以找到更多怪物。' : 'Try adjusting your search or filters to find more monsters.')

  // Create filters object for ClientSearchFilter
  const filters = useMemo(() => ({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    element: selectedElement !== 'all' ? selectedElement : undefined,
    race: selectedRace !== 'all' ? selectedRace : undefined
  }), [selectedCategory, selectedElement, selectedRace])

  // Get unique filter values from monsters
  const categories = useMemo(() => {
    const uniqueCategories = new Set(monsters.map(monster => monster.category))
    return Array.from(uniqueCategories)
  }, [monsters])

  const elements = useMemo(() => {
    const uniqueElements = new Set(monsters.map(monster => monster.element))
    return Array.from(uniqueElements).filter(Boolean) // Remove any null/undefined values
  }, [monsters])

  const races = useMemo(() => {
    const uniqueRaces = new Set(monsters.map(monster => monster.race))
    return Array.from(uniqueRaces).filter(Boolean) // Remove any null/undefined values
  }, [monsters])

  // Show loading state when fetching data
  if (isLoading && (!monsters || monsters.length === 0)) {
    return (
      <div className="space-y-8">
        <div className="minecraft-card p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="minecraft-card p-4 animate-pulse">
              <div className="h-40 bg-slate-200 rounded mb-4"></div>
              <div className="h-6 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="minecraft-card p-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
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

            {/* Element Filter */}
            <div className="md:w-48">
              <select
                value={selectedElement}
                onChange={(e) => setSelectedElement(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{allElementsLabel}</option>
                {elements.map((element) => (
                  <option key={element} value={element}>
                    {getElementLabel(element)}
                  </option>
                ))}
              </select>
            </div>

            {/* Race Filter */}
            <div className="md:w-48">
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{allRacesLabel}</option>
                {races.map((race) => (
                  <option key={race} value={race}>
                    {getRaceLabel(race)}
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
        </div>

      </div>

      {/* Client-Side Filtered Monster Grid */}
      <ClientSearchFilter
        data={monsters}
        searchQuery={searchQuery}
        filters={filters}
        searchFields={['name', 'description', 'excerpt']}
        categoryField="category"
      >
        {(filteredMonsters) => (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              {showingLabel} {filteredMonsters.length} {ofLabel} {monsters.length} {monstersLabel}
            </div>

            {filteredMonsters.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {emptyTitle}
                </h3>
                <p className="text-gray-600">
                  {emptyDescription}
                </p>
              </div>
            ) : (
              /* Monster Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMonsters.map((monster) => (
                  <MonsterCard key={monster.id} monster={monster} />
                ))}
              </div>
            )}
          </>
        )}
      </ClientSearchFilter>
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

  const getCategoryBadgeStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hostile': return 'bg-red-100/90 text-red-700 border-red-200/60'
      case 'passive': return 'bg-green-100/90 text-green-700 border-green-200/60'
      case 'neutral': return 'bg-yellow-100/90 text-yellow-700 border-yellow-200/60'
      case 'boss': return 'bg-purple-100/90 text-purple-700 border-purple-200/60'
      default: return 'bg-gray-100/90 text-gray-700 border-gray-200/60'
    }
  }

  const getCategoryDotColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hostile': return 'bg-red-500'
      case 'passive': return 'bg-green-500'
      case 'neutral': return 'bg-yellow-500'
      case 'boss': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getElementLabel = (element: string) => {
    if (!isZhTW) return element.charAt(0).toUpperCase() + element.slice(1)
    switch (element.toLowerCase()) {
      case 'fire': return '火'
      case 'water': return '水'
      case 'earth': return '土'
      case 'air': return '風'
      case 'light': return '光'
      case 'dark': return '暗'
      case 'ice': return '冰'
      case 'lightning': return '雷'
      case 'none': return '無'
      default: return element
    }
  }

  const getRaceLabel = (race: string) => {
    if (!isZhTW) return race.charAt(0).toUpperCase() + race.slice(1)
    switch (race.toLowerCase()) {
      case 'god': return '神'
      case 'dragon': return '龍'
      case 'goblin': return '哥布林'
      case 'orc': return '獸人'
      case 'elf': return '精靈'
      case 'dwarf': return '矮人'
      case 'troll': return '巨魔'
      case 'giant': return '巨人'
      case 'undead': return '不死族'
      case 'skeleton': return '骷髏'
      case 'zombie': return '殭屍'
      case 'vampire': return '吸血鬼'
      case 'ghost': return '幽靈'
      case 'demon': return '惡魔'
      case 'angel': return '天使'
      case 'fairy': return '妖精'
      case 'phoenix': return '鳳凰'
      case 'beast': return '野獸'
      case 'wolf': return '狼'
      case 'bear': return '熊'
      case 'cat': return '貓'
      case 'bird': return '鳥'
      case 'fish': return '魚'
      case 'snake': return '蛇'
      case 'spider': return '蜘蛛'
      case 'insect': return '昆蟲'
      case 'slime': return '史萊姆'
      case 'golem': return '魔像'
      case 'construct': return '構造體'
      case 'robot': return '機器人'
      case 'elemental': return '元素'
      case 'plant': return '植物'
      case 'humanoid': return '人形'
      case 'alien': return '外星人'
      case 'void': return '虛無'
      default: return race
    }
  }

  return (
    <Link href={`/dex/${monster.slug}`} className="block group">
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/60 hover:border-slate-300/80 group-hover:-translate-y-1">
        {/* Monster 3D Model Preview */}
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          <LazyModelViewer 
            modelPath={monster.modelPath} 
            className="w-full h-full"
            modelScale={monster.modelScale || 40} // Smaller scale for card view
            cameraPosition={monster.camera?.position || { x: 2, y: 2, z: 4 }}
            cameraLookAt={monster.camera?.lookAt || { x: 0, y: 0, z: 0 }}
          />
          
          {/* Category badge - improved positioning and styling */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm border ${getCategoryBadgeStyle(monster.category)}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${getCategoryDotColor(monster.category)}`}></span>
              {getCategoryLabel(monster.category)}
            </span>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Monster Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-xl text-slate-900 group-hover:text-emerald-600 transition-colors duration-200 leading-tight">
              {monster.name}
            </h3>
            <div className="flex items-center space-x-1 text-slate-400 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
            {monster.excerpt || monster.description}
          </p>

          {/* Element and Race badges */}
          <div className="flex items-center gap-2 mb-4">
            {monster.element && (
              <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200/60">
                ⚡ {getElementLabel(monster.element)}
              </span>
            )}
            {monster.race && (
              <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200/60">
                👤 {getRaceLabel(monster.race)}
              </span>
            )}
          </div>


          {/* Spawning Info Preview */}
          {monster.spawning?.worlds && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200/60">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {t.dex.worlds[monster.spawning.worlds as keyof typeof t.dex.worlds] || monster.spawning.worlds}
              </span>
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