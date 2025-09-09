import { notFound } from 'next/navigation'
import { MonsterDetailContent } from '@/app/components/pages/dex/MonsterDetailContent'
import type { DexMonster } from '@/lib/types'

interface MonsterPageProps {
  params: Promise<{
    slug: string
  }>
}

// Server-side data fetching function
async function getMonsterData(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/dex/monsters/${slug}`, {
      next: { 
        revalidate: 10, // Revalidate every 10 seconds
        tags: [`dex-monster-${slug}`] // Cache tag for targeted revalidation
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success ? data.data?.monster : null
  } catch (error) {
    console.error('Error fetching monster data:', error)
    return null
  }
}

export default async function MonsterPage({ params }: MonsterPageProps) {
  const { slug } = await params
  const monster = await getMonsterData(slug) as DexMonster | null

  if (!monster) {
    notFound()
  }

  return <MonsterDetailContent slug={slug} initialMonster={monster} />
}