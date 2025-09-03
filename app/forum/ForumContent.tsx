'use client'

import { ForumContent as ForumContentComponent } from '@/app/components/pages/forum'
import type { ForumCategory, ForumStatsResponse as ForumStats, ForumPost } from '@/lib/types'

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