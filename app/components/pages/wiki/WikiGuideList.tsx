'use client'

import React, { memo } from 'react'
import { WikiGuideCard } from './WikiGuideCard'
import type { WikiGuide } from '@/lib/types'

interface WikiGuideListProps {
  guides: WikiGuide[]
  showCategory?: boolean
  layout?: 'grid' | 'list'
}

export const WikiGuideList = memo(function WikiGuideList({ 
  guides, 
  showCategory = true,
  layout = 'grid'
}: WikiGuideListProps) {
  if (!guides || guides.length === 0) {
    return null
  }

  if (layout === 'list') {
    return (
      <div className="space-y-4">
        {guides.map((guide) => (
          <WikiGuideCard
            key={guide._id.toString()}
            guide={guide}
            showCategory={showCategory}
            layout="list"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {guides.map((guide) => (
        <WikiGuideCard
          key={guide._id.toString()}
          guide={guide}
          showCategory={showCategory}
          layout="card"
        />
      ))}
    </div>
  )
})

WikiGuideList.displayName = 'WikiGuideList'