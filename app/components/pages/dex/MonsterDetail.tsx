'use client'

import { Suspense } from 'react'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import type { DexMonster } from '@/lib/types'
import dynamic from 'next/dynamic'
import { Icon } from '@/app/components/ui/Icon'
import { DexActions } from '@/app/components/dex/DexActions'

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
  const healthLabel = isZhTW ? '生命值' : 'Health'
  const damageLabel = isZhTW ? '攻擊力' : 'Damage'
  const xpDropLabel = isZhTW ? '經驗值' : 'XP Drop'
  const elementLabel = isZhTW ? '屬性' : 'Element'
  const raceLabel = isZhTW ? '種族' : 'Race'
  const monsterInfoTitle = isZhTW ? '怪物資訊' : 'Monster Information'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            
            
            {/* Monster Title */}
            <h1 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-none">
              <span className="minecraft-gradient-text">{monster.name}</span>
            </h1>
            
            {/* Attributes */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {monster.element && (
                <span className="inline-flex items-center px-4 py-2 bg-blue-50/80 text-blue-700 rounded-xl text-sm font-semibold border border-blue-200/50 shadow-sm backdrop-blur-sm">
                  <span className="mr-2 text-lg">⚡</span>
                  {getElementLabel(monster.element)}
                </span>
              )}
              {monster.race && (
                <span className="inline-flex items-center px-4 py-2 bg-purple-50/80 text-purple-700 rounded-xl text-sm font-semibold border border-purple-200/50 shadow-sm backdrop-blur-sm">
                  <span className="mr-2 text-lg">👤</span>
                  {getRaceLabel(monster.race)}
                </span>
              )}
            </div>
            
            {/* Description */}
            <div className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto prose prose-slate prose-xl">
              <div dangerouslySetInnerHTML={{ __html: monster.description || '' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections - Side by Side Layout */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Side - Monster Information (2 columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Monster Information */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <Icon name="info" className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{monsterInfoTitle}</h2>
              </div>
              
              <div className="space-y-8">
                {/* Basic Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Category */}
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-600 font-semibold text-sm">Category</span>
                      <Icon name="tag" className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-slate-800 font-bold text-lg">{getCategoryLabel(monster.category)}</div>
                  </div>
                  
                  {/* Element */}
                  {monster.element && (
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-600 font-semibold text-sm">{elementLabel}</span>
                        <span className="text-lg">⚡</span>
                      </div>
                      <div className="text-blue-800 font-bold text-lg">{getElementLabel(monster.element)}</div>
                    </div>
                  )}
                  
                  {/* Race */}
                  {monster.race && (
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-600 font-semibold text-sm">{raceLabel}</span>
                        <span className="text-lg">👤</span>
                      </div>
                      <div className="text-purple-800 font-bold text-lg">{getRaceLabel(monster.race)}</div>
                    </div>
                  )}
                  
                  {/* Health */}
                  <div className="p-4 bg-red-50/50 rounded-xl border border-red-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-600 font-semibold text-sm">{healthLabel}</span>
                      <Icon name="heart" className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-red-800 font-bold text-lg">{monster.stats.health} HP</div>
                  </div>
                  
                  {/* Damage */}
                  <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-orange-600 font-semibold text-sm">{damageLabel}</span>
                      <Icon name="sword" className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-orange-800 font-bold text-lg">{monster.stats.damage} DMG</div>
                  </div>
                  
                  {/* XP Drop */}
                  <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-600 font-semibold text-sm">{xpDropLabel}</span>
                      <Icon name="star" className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="text-yellow-800 font-bold text-lg">{monster.stats.xpDrop} XP</div>
                  </div>
                </div>

                {/* Spawning Information Section */}
                <div className="border-t border-slate-200/50 pt-6">
                  <h3 className="text-emerald-600 font-bold text-xl mb-6">
                    {isZhTW ? '生成條件' : 'Spawning Conditions'}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Worlds */}
                    {monster.spawning?.worlds && (
                      <div>
                        <h4 className="text-emerald-600 font-bold text-lg mb-3">
                          {worldsLabel}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-lg border border-emerald-200/50">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="font-medium text-emerald-800">
                              {t.dex.worlds[monster.spawning.worlds as keyof typeof t.dex.worlds] || monster.spawning.worlds}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Biomes */}
                    {monster.spawning?.biomes && monster.spawning.biomes.length > 0 && (
                      <div>
                        <h4 className="text-green-600 font-bold text-lg mb-3 flex items-center gap-2">
                          <Icon name="mountain" className="w-5 h-5" />
                          {biomesLabel}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {monster.spawning.biomes.map((biome) => (
                            <span key={biome} className="inline-flex items-center gap-2 px-3 py-2 bg-green-50/50 rounded-lg border border-green-200/50">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium text-green-800">{biome}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Structures */}
                    {monster.spawning?.structures && monster.spawning.structures.length > 0 && (
                      <div>
                        <h4 className="text-purple-600 font-bold text-lg mb-3 flex items-center gap-2">
                          <Icon name="building" className="w-5 h-5" />
                          {structuresLabel}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {monster.spawning.structures.map((structure) => (
                            <span key={structure} className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50/50 rounded-lg border border-purple-200/50">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="font-medium text-purple-800">{structure}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Environmental Conditions */}
                    <div>
                      <h4 className="text-blue-600 font-bold text-lg mb-4 flex items-center gap-2">
                        <Icon name="sun" className="w-5 h-5" />
                        {conditionsLabel}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {monster.spawning?.timeOfDay && (
                          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-600 font-semibold text-sm">{timeLabel}</span>
                              <Icon name="clock" className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-blue-800 font-bold text-lg">{getTimeOfDayLabel(monster.spawning.timeOfDay)}</div>
                          </div>
                        )}
                        {monster.spawning?.lightLevel && (
                          <div className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-200/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-yellow-600 font-semibold text-sm">{lightLevelLabel}</span>
                              <Icon name="sun" className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div className="text-yellow-800 font-bold text-lg">{monster.spawning.lightLevel.min}-{monster.spawning.lightLevel.max}</div>
                          </div>
                        )}
                        {monster.spawning?.spawnRate && (
                          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-indigo-600 font-semibold text-sm">{isZhTW ? '稀有度' : 'Spawn Rate'}</span>
                              <Icon name="activity" className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="text-indigo-800 font-bold text-lg">{getSpawnRateLabel(monster.spawning.spawnRate)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-6 backdrop-blur-sm">
              <DexActions monster={monster} />
            </div>

            {/* Behaviors */}
            {monster.behaviors && monster.behaviors.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <Icon name="activity" className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{behaviorsTitle}</h2>
                </div>
                
                <div className="space-y-4">
                  {monster.behaviors.map((behavior, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200/50">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0"></div>
                      <span className="text-slate-700 font-medium">{behavior}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Drops */}
            {monster.drops && monster.drops.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-amber-100 rounded-2xl">
                    <Icon name="diamond" className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{dropsTitle}</h2>
                </div>
                
                <div className="space-y-4">
                  {monster.drops.map((drop, index) => (
                    <div key={index} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 text-lg">{drop.itemName}</h3>
                        {drop.isRare && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-300">{rareLabel}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">{dropChanceLabel}</span>
                          <span className="font-bold text-emerald-600 text-lg">{(drop.dropChance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">{quantityLabel}</span>
                          <span className="font-bold text-blue-600 text-lg">{drop.minQuantity}-{drop.maxQuantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {monster.tags && monster.tags.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{tagsTitle}</h2>
                <div className="flex flex-wrap gap-3">
                  {monster.tags.map((tag) => (
                    <span key={tag} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - 3D Model (1 column, sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="relative">
                <div className="w-full h-96 lg:h-[600px] bg-gradient-to-br from-white to-slate-100 rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
                  <Suspense fallback={<ModelViewerSkeleton />}>
                    <ModelViewer 
                      modelPath={monster.modelPath} 
                      className="w-full h-full"
                      modelScale={monster.modelScale || 1.0}
                      cameraPosition={monster.camera?.position || { x: 2, y: 2, z: 4 }}
                      cameraLookAt={monster.camera?.lookAt || { x: 0, y: 0, z: 0 }}
                    />
                  </Suspense>
                </div>
                {/* Decorative Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelViewerSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Icon name="model3d" className="w-16 h-16 text-slate-500" />
        </div>
        <div className="text-slate-600 font-medium">Loading 3D Model...</div>
      </div>
    </div>
  )
}