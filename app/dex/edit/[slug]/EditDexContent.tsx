'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/app/components/ui/Icon'
import { DexForm } from '@/app/components/dex/DexForm'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { useDexMonster } from '@/lib/hooks/useDex'
import type { DexMonster } from '@/lib/types'
import type { DexModelOption } from '@/lib/utils/dex-models'

interface EditDexContentProps {
  initialMonster: DexMonster
  initialModels: DexModelOption[]
  slug: string
}

export default function EditDexContent({ initialMonster, initialModels, slug }: EditDexContentProps) {
  const router = useRouter()
  const { t } = useTranslation()
  
  // Use dex hook with initial data for client-side updates
  const { data: monster } = useDexMonster(slug, { enabled: false }) // Since we already have initial data

  const currentMonster = monster || initialMonster

  return (
    <div className="min-h-screen">
      <div className="w-full py-8 px-6">
        {/* Breadcrumb Navigation */}
        <div className="minecraft-panel p-4 mb-6">
          <div className="flex items-center space-x-2 text-sm text-slate-700">
            <Link href="/dex" className="text-emerald-600 hover:text-emerald-700 font-medium">{t.nav.dex}</Link>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
            <Link href={`/dex/${slug}`} className="text-emerald-600 hover:text-emerald-700 font-medium">{currentMonster.name}</Link>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800 font-medium">{t.dex.forms.edit.title}</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="minecraft-card mb-6">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Icon name="edit" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{t.dex.forms.edit.title}</h1>
                <p className="text-slate-600">{t.dex.forms.edit.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form - No additional containers to interfere with sticky positioning */}
        <DexForm 
          monster={currentMonster}
          initialModels={initialModels}
          onSuccess={(monsterSlug: string) => {
            // Redirect to the monster detail page with the (possibly new) slug
            router.push(`/dex/${monsterSlug}`)
          }}
          onCancel={() => router.push(`/dex/${slug}`)}
        />
      </div>
    </div>
  )
}