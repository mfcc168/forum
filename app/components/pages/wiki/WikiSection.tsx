'use client';

import { useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/contexts/LanguageContext'
// import { getAvailableGuides } from '@/lib/content/wiki/loader' // Commented out - replaced with API call

interface WikiSectionProps {
  title: string;
  items: string[];
  color: string;
  category: 'getting-started' | 'gameplay' | 'features' | 'community';
}

// Mapping from translation keys to guide slugs
const ITEM_TO_SLUG_MAP: Record<string, string> = {
  // Getting Started
  '如何加入伺服器': 'how-to-join-server',
  '新手入門指南': 'new-player-guide', 
  '基本指令': 'basic-commands',
  '伺服器規則': 'server-rules',
  'How to Join the Server': 'how-to-join-server',
  'How to Join Server': 'how-to-join-server',
  'First Steps Guide': 'new-player-guide',
  'New Player Guide': 'new-player-guide',
  'Basic Commands': 'basic-commands', 
  'Server Rules': 'server-rules',
  
  // Gameplay
  '經濟系統': 'economy-system',
  '土地保護': 'land-protection',
  '玩家商店': 'player-shops',
  '職業系統': 'job-system',
  'Economy System': 'economy-system',
  'Land Claims': 'land-protection',
  'Land Protection': 'land-protection',
  'Player Shops': 'player-shops',
  'Jobs & Professions': 'job-system',
  'Job System': 'job-system',
  
  // Features
  '自訂物品': 'custom-items',
  '特殊活動': 'special-events',
  '地牢與突襲': 'dungeons-raids',
  'PvP 區域': 'pvp-areas',
  'Custom Items': 'custom-items',
  'Special Events': 'special-events',
  'Dungeons & Raids': 'dungeons-raids',
  'PvP Zones': 'pvp-areas',
  'PvP Areas': 'pvp-areas',
  
  // Community
  '城鎮與城市': 'towns-cities',
  '公會系統': 'guild-system',
  '玩家排名': 'player-rankings',
  'Discord 整合': 'discord-integration',
  'Towns & Cities': 'towns-cities',
  'Guilds System': 'guild-system',
  'Guild System': 'guild-system',
  'Player Rankings': 'player-rankings',
  'Discord Integration': 'discord-integration'
}

export function WikiSection({ title, items, color }: WikiSectionProps) {
  const { locale } = useTranslation()
  
  // Memoize available guides to prevent re-renders
  const availableGuides = useMemo(() => {
    // Future enhancement: Use useWikiGuides hook to fetch available guide slugs
    // This would enable dynamic guide availability checking
    return [] as string[] // Currently assuming guides are created through admin interface
  }, [])
  
  // Memoize the item processing to ensure it updates when items or available guides change
  const processedItems = useMemo(() => {
    return items.map((item: string, itemIndex: number) => {
      const guideSlug = ITEM_TO_SLUG_MAP[item]
      const isAvailable = guideSlug && availableGuides.includes(guideSlug)
      return { item, itemIndex, guideSlug, isAvailable }
    })
  }, [items, availableGuides])
  
  return (
    <div className="minecraft-panel p-8" key={`${locale}-${title}`}>
      <h3 className="text-2xl font-bold text-slate-800 mb-6">
        {title}
      </h3>
      <ul className="space-y-3">
        {processedItems.map(({ item, itemIndex, guideSlug, isAvailable }) => {
          
          if (isAvailable) {
            return (
              <li key={`${locale}-${itemIndex}-${item}`}>
                <Link href={`/wiki/${guideSlug}`}>
                  <div className="minecraft-card w-full p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <span className={`w-2 h-2 bg-${color}-500 rounded-full`}></span>
                      <span className="text-slate-700 font-medium">{item}</span>
                      <span className="ml-auto text-slate-400">→</span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          }
          
          return (
            <li key={`${locale}-${itemIndex}-${item}`}>
              <div className="minecraft-card w-full p-4 text-left opacity-50 cursor-not-allowed">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 bg-gray-400 rounded-full`}></span>
                  <span className="text-slate-500 font-medium">{item}</span>
                  <span className="ml-auto text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
}