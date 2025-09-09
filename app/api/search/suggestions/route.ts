import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

// ============================================================================
// SEARCH SUGGESTIONS API
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const moduleParam = searchParams.get('module') as 'blog' | 'forum' | 'wiki' | null

    if (!query || query.length < 2) {
      return ApiResponse.success({
        completions: [],
        corrections: [],
        popular: []
      })
    }

    const suggestions = await generateSuggestions(query, moduleParam)
    const searchTime = performance.now() - startTime

    return ApiResponse.success({
      ...suggestions,
      searchTime: Math.round(searchTime)
    })

  } catch (error) {
    console.error('Suggestions API error:', error)
    const searchTime = performance.now() - startTime
    
    return ApiResponse.error('Failed to generate suggestions', 500, {
      searchTime: Math.round(searchTime)
    })
  }
}

// ============================================================================
// SUGGESTION GENERATION
// ============================================================================

async function generateSuggestions(query: string, moduleType?: 'blog' | 'forum' | 'wiki' | null) {
  const suggestions = {
    completions: [] as string[],
    corrections: [] as string[],
    popular: [] as string[]
  }

  try {
    // Get title-based completions from specific module or all modules
    let allCompletions: string[] = []
    
    if (moduleType) {
      // Module-specific completions
      switch (moduleType) {
        case 'forum':
          allCompletions = await getForumTitleCompletions(query)
          break
        case 'blog':
          allCompletions = await getBlogTitleCompletions(query)
          break
        case 'wiki':
          allCompletions = await getWikiTitleCompletions(query)
          break
      }
    } else {
      // All modules (backward compatibility)
      const [forumTitles, blogTitles, wikiTitles] = await Promise.all([
        getForumTitleCompletions(query),
        getBlogTitleCompletions(query),
        getWikiTitleCompletions(query)
      ])
      allCompletions = [...forumTitles, ...blogTitles, ...wikiTitles]
    }

    suggestions.completions = rankCompletions(allCompletions, query)
      .slice(0, 5)

    // Generate query corrections for typos
    suggestions.corrections = await generateCorrections(query)

    // Get module-specific popular searches
    suggestions.popular = await getPopularSearches(query, moduleType)

  } catch (error) {
    console.error('Error generating suggestions:', error)
  }

  return suggestions
}

async function getForumTitleCompletions(query: string): Promise<string[]> {
  try {
    // Search forum posts by title
    const results = await DAL.forum.getPosts({
      search: query,
      sortBy: 'popular',
      status: 'active'
    }, { page: 1, limit: 10 })

    return results.data
      .filter(post => post.title.toLowerCase().includes(query.toLowerCase()))
      .map(post => post.title)
  } catch (error) {
    console.error('Forum title completions error:', error)
    return []
  }
}

async function getBlogTitleCompletions(query: string): Promise<string[]> {
  try {
    // Search blog posts by title
    const results = await DAL.blog.getPosts({
      search: query,
      status: 'published'
    }, { page: 1, limit: 10 })

    return results.data
      .filter(post => post.title.toLowerCase().includes(query.toLowerCase()))
      .map(post => post.title)
  } catch (error) {
    console.error('Blog title completions error:', error)
    return []
  }
}

async function getWikiTitleCompletions(query: string): Promise<string[]> {
  try {
    // Search wiki guides by title
    const results = await DAL.wiki.getGuides({
      search: query,
      status: 'published'
    }, { page: 1, limit: 10 })

    return results.data
      .filter(guide => guide.title.toLowerCase().includes(query.toLowerCase()))
      .map(guide => guide.title)
  } catch (error) {
    console.error('Wiki title completions error:', error)
    return []
  }
}

function rankCompletions(completions: string[], query: string): string[] {
  const queryLower = query.toLowerCase()
  
  return completions
    // Remove duplicates
    .filter((completion, index, arr) => 
      arr.findIndex(c => c.toLowerCase() === completion.toLowerCase()) === index
    )
    // Sort by relevance
    .sort((a, b) => {
      const aLower = a.toLowerCase()
      const bLower = b.toLowerCase()
      
      // Exact matches first
      if (aLower === queryLower) return -1
      if (bLower === queryLower) return 1
      
      // Starts with query
      const aStarts = aLower.startsWith(queryLower)
      const bStarts = bLower.startsWith(queryLower)
      if (aStarts && !bStarts) return -1
      if (bStarts && !aStarts) return 1
      
      // Contains query (closer to start is better)
      const aIndex = aLower.indexOf(queryLower)
      const bIndex = bLower.indexOf(queryLower)
      if (aIndex !== bIndex) return aIndex - bIndex
      
      // Shorter titles first
      return a.length - b.length
    })
}

async function generateCorrections(query: string): Promise<string[]> {
  // Simple spell correction logic - in production this could use a spell check library
  const corrections = []
  
  // Common Minecraft-related corrections
  const commonCorrections: { [key: string]: string } = {
    'mincraft': 'minecraft',
    'recepie': 'recipe',
    'recepies': 'recipes',
    'buildin': 'building',
    'redston': 'redstone',
    'enchantin': 'enchanting',
    'encahnt': 'enchant',
    'vilager': 'villager',
    'vilagers': 'villagers',
    'potion': 'potions',
    'armour': 'armor',
    'favour': 'favor',
    'colour': 'color'
  }

  const queryWords = query.toLowerCase().split(' ')
  let hasCorrected = false

  const correctedWords = queryWords.map(word => {
    if (commonCorrections[word]) {
      hasCorrected = true
      return commonCorrections[word]
    }
    return word
  })

  if (hasCorrected) {
    corrections.push(correctedWords.join(' '))
  }

  // Check for common typos (single character substitution)
  if (query.length > 3 && corrections.length === 0) {
    const commonWords = [
      'minecraft', 'building', 'recipe', 'redstone', 'enchanting', 
      'villager', 'trading', 'farming', 'mining', 'crafting',
      'tutorial', 'guide', 'how', 'best', 'tips', 'tricks'
    ]

    for (const word of commonWords) {
      if (isTypo(query.toLowerCase(), word)) {
        corrections.push(word)
        break
      }
    }
  }

  return corrections.slice(0, 2)
}

function isTypo(input: string, target: string): boolean {
  // Simple edit distance check for single character typos
  if (Math.abs(input.length - target.length) > 1) return false
  
  let differences = 0
  const maxLen = Math.max(input.length, target.length)
  
  for (let i = 0; i < maxLen; i++) {
    if (input[i] !== target[i]) {
      differences++
      if (differences > 1) return false
    }
  }
  
  return differences === 1
}

async function getPopularSearches(query: string, moduleType?: 'blog' | 'forum' | 'wiki' | null): Promise<string[]> {
  // Module-specific popular searches
  const popularSearches = getModulePopularSearches(moduleType)

  const queryLower = query.toLowerCase()
  return popularSearches
    .filter(search => search.includes(queryLower))
    .slice(0, 3)
}

function getModulePopularSearches(moduleType?: 'blog' | 'forum' | 'wiki' | null): string[] {
  switch (moduleType) {
    case 'blog':
      return [
        'server news',
        'community updates',
        'patch notes',
        'developer insights',
        'player spotlights',
        'event announcements',
        'maintenance schedules',
        'feature releases'
      ]
    case 'forum':
      return [
        'technical support',
        'server rules',
        'player reports',
        'community discussion',
        'suggestions',
        'bug reports',
        'general chat',
        'help needed'
      ]
    case 'wiki':
      return [
        'minecraft guide',
        'redstone contraptions', 
        'building techniques',
        'enchanting guide',
        'villager trading',
        'automatic farms',
        'mob spawner designs',
        'gameplay mechanics'
      ]
    default:
      return [
        'minecraft server setup',
        'redstone contraptions', 
        'building techniques',
        'enchanting guide',
        'villager trading',
        'automatic farms',
        'mob spawner designs',
        'resource pack creation',
        'plugin development',
        'world generation'
      ]
  }
}

// Rate limiting for suggestions
export const dynamic = 'force-dynamic'
export const revalidate = 0