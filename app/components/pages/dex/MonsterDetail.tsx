'use client'

import { Suspense } from 'react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { formatNumber } from '@/lib/utils'
import type { DexMonster } from '@/lib/types'
import dynamic from 'next/dynamic'
import { Icon } from '@/app/components/ui/Icon'

// Dynamically import the 3D model viewer with no SSR
const ModelViewer = dynamic(() => import('@/app/components/dex/ModelViewer').then(mod => ({ default: mod.ModelViewer })), {
  ssr: false,
  loading: () => <ModelViewerSkeleton />
})

interface MonsterDetailProps {
  monster: DexMonster
}

export function MonsterDetail({ monster }: MonsterDetailProps) {
  const { t, locale } = useTranslation()
  
  // Hardcoded translations as fallback
  const isZhTW = locale === 'zh-TW'
  const combatStatsTitle = isZhTW ? '戰鬥數據' : 'Combat Statistics'
  const healthLabel = isZhTW ? '生命值' : 'Health'
  const damageLabel = isZhTW ? '攻擊力' : 'Damage'
  const speedLabel = isZhTW ? '速度' : 'Speed'
  const xpDropLabel = isZhTW ? '經驗值' : 'XP Drop'
  const spawningTitle = isZhTW ? '生成資訊' : 'Spawning Information'
  const worldsLabel = isZhTW ? '世界' : 'Worlds'
  const biomesLabel = isZhTW ? '生態域' : 'Biomes'
  const conditionsLabel = isZhTW ? '條件' : 'Conditions'
  const structuresLabel = isZhTW ? '結構' : 'Structures'
  const timeLabel = isZhTW ? '時間' : 'Time'
  const lightLevelLabel = isZhTW ? '亮度等級' : 'Light Level'
  const behaviorsTitle = isZhTW ? '行為' : 'Behaviors'
  const dropsTitle = isZhTW ? '物品掉落' : 'Item Drops'
  const rareLabel = isZhTW ? '稀有' : 'RARE'
  const dropChanceLabel = isZhTW ? '掉落機率' : 'Drop Chance'
  const quantityLabel = isZhTW ? '數量' : 'Quantity'
  const tagsTitle = isZhTW ? '標籤' : 'Tags'

  // Dynamic value translations
  const getSpawnRateLabel = (spawnRate: string) => {
    if (!isZhTW) return spawnRate.charAt(0).toUpperCase() + spawnRate.slice(1)
    switch (spawnRate.toLowerCase()) {
      case 'common': return '常見'
      case 'uncommon': return '不常見'
      case 'rare': return '稀有'
      case 'legendary': return '傳說'
      default: return spawnRate
    }
  }

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

  const getTimeOfDayLabel = (timeOfDay: string) => {
    if (!isZhTW) return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)
    switch (timeOfDay.toLowerCase()) {
      case 'day': return '白天'
      case 'night': return '夜晚'
      case 'any': return '任何時間'
      default: return timeOfDay
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hostile': return <Icon name="monster" className="w-8 h-8 text-red-500" />
      case 'passive': return <Icon name="monster" className="w-8 h-8 text-green-500" />
      case 'neutral': return <Icon name="monster" className="w-8 h-8 text-yellow-500" />
      case 'boss': return <Icon name="monster" className="w-8 h-8 text-purple-500" />
      default: return <Icon name="monster" className="w-8 h-8 text-gray-500" />
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-200'
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'legendary': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Monster Info */}
            <div className="flex-1">
              <div className="mb-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
                    {monster.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRarityColor(monster.spawning.spawnRate)}`}>
                      {getCategoryLabel(monster.category)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRarityColor(monster.spawning.spawnRate)}`}>
                      {getSpawnRateLabel(monster.spawning.spawnRate)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-2xl">
                {monster.excerpt || monster.description}
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - 3D Model */}
          <div className="xl:col-span-1">
            <div className="rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="aspect-square rounded-xl overflow-hidden">
                  <Suspense fallback={<ModelViewerSkeleton />}>
                    <ModelViewer 
                      modelPath={monster.modelPath} 
                      className="w-full h-full"
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="xl:col-span-2 space-y-8">
            {/* Combat Statistics */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">
                  {combatStatsTitle}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={<Icon name="heart" className="w-8 h-8" />}
                    label={healthLabel} 
                    value={monster.stats.health}
                    color="red"
                  />
                  <StatCard 
                    icon={<Icon name="sword" className="w-8 h-8" />}
                    label={damageLabel} 
                    value={monster.stats.damage}
                    color="orange"
                  />
                  <StatCard 
                    icon={<Icon name="flash" className="w-8 h-8" />}
                    label={speedLabel} 
                    value={monster.stats.speed}
                    color="blue"
                  />
                  <StatCard 
                    icon={<Icon name="diamond" className="w-8 h-8" />}
                    label={xpDropLabel} 
                    value={monster.stats.xpDrop}
                    color="yellow"
                  />
                </div>
              </div>
            </div>

            {/* Spawning Information */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">
                  {spawningTitle}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Worlds */}
                  {monster.spawning?.worlds && monster.spawning.worlds.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Icon name="globe" className="w-5 h-5 text-slate-600" />
                        {worldsLabel}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {monster.spawning.worlds.map((world) => (
                          <span key={world} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium border border-emerald-200">
                            {world}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Biomes */}
                  {monster.spawning?.biomes && monster.spawning.biomes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Icon name="terrain" className="w-5 h-5 text-slate-600" />
                        {biomesLabel}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {monster.spawning.biomes.map((biome) => (
                          <span key={biome} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-200">
                            {biome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spawn Conditions */}
                  {monster.spawning && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Icon name="clock" className="w-5 h-5 text-slate-600" />
                        {conditionsLabel}
                      </h3>
                      <div className="space-y-2">
                        {monster.spawning.timeOfDay && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-slate-600">{timeLabel}:</span>
                            <span className="font-medium text-slate-900">{getTimeOfDayLabel(monster.spawning.timeOfDay)}</span>
                          </div>
                        )}
                        {monster.spawning.lightLevel && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="text-slate-600">{lightLevelLabel}:</span>
                            <span className="font-medium text-slate-900">{monster.spawning.lightLevel.min}-{monster.spawning.lightLevel.max}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Structures (if any) */}
                  {monster.spawning?.structures && monster.spawning.structures.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Icon name="build" className="w-5 h-5 text-slate-600" />
                        {structuresLabel}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {monster.spawning.structures.map((structure) => (
                          <span key={structure} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium border border-purple-200">
                            {structure}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Behaviors */}
            {monster.behaviors.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    {behaviorsTitle}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {monster.behaviors.map((behavior, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        <span className="text-slate-700 font-medium">{behavior}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Drops */}
            {monster.drops.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    {dropsTitle}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {monster.drops.map((drop, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-slate-900">{drop.itemName}</h3>
                          {drop.isRare && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1">
                              <Icon name="diamond" className="w-3 h-3" /> {rareLabel}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{dropChanceLabel}:</span>
                            <span className="font-semibold text-slate-900">{(drop.dropChance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{quantityLabel}:</span>
                            <span className="font-semibold text-slate-900">{drop.minQuantity}-{drop.maxQuantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {monster.tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    {tagsTitle}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {monster.tags.map((tag) => (
                      <span key={tag} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-200 transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable Stat Card Component
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'red' | 'orange' | 'blue' | 'yellow'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    red: 'text-red-600 bg-red-50 border-red-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }

  return (
    <div className={`p-4 rounded-xl border-2 ${colorClasses[color]} text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium opacity-80">{label}</div>
    </div>
  )
}

function ModelViewerSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Icon name="model3d" className="w-16 h-16 text-slate-400" />
        </div>
        <div className="text-slate-500 font-medium">Loading 3D Model...</div>
      </div>
    </div>
  )
}