'use client'

import { ForumContent as ForumContentComponent } from '@/app/components/pages/forum'
import type { ForumCategory, ForumPost } from '@/lib/types'
import type { ForumStats } from '@/lib/types/entities/stats'

interface ForumContentProps {
  initialPosts?: ForumPost[]
  initialCategories?: ForumCategory[]
  initialStats?: ForumStats
}

export default function ForumContent({ 
  initialPosts, 
  initialCategories,
  initialStats
}: ForumContentProps) {
  return (
    <ForumContentComponent 
      initialPosts={initialPosts}
      initialCategories={initialCategories}
      initialStats={initialStats}
    />
  )
}