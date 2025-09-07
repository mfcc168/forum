'use client'

import { MonsterDetail } from './MonsterDetail'
import type { DexMonster } from '@/lib/types'

interface MonsterDetailContentProps {
  slug: string
  initialMonster: DexMonster
}

export function MonsterDetailContent({ slug, initialMonster }: MonsterDetailContentProps) {
  // This client component wrapper ensures the language context is available
  // for the MonsterDetail component's useTranslation hook
  return <MonsterDetail monster={initialMonster} />
}