'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/app/components/ui/Icon'
import { WikiForm } from '@/app/components/wiki/WikiForm'
import { useTranslation } from '@/lib/contexts/LanguageContext'

export default function CreateWikiContent() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen">
      <div className="w-full py-8 px-6">
        {/* Breadcrumb Navigation */}
        <div className="minecraft-panel p-4 mb-6">
          <div className="flex items-center space-x-2 text-sm text-slate-700">
            <Link href="/wiki" className="text-emerald-600 hover:text-emerald-700 font-medium">{t.nav?.wiki || 'Wiki'}</Link>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800 font-medium">{t.wiki?.forms?.create?.title || 'Create Guide'}</span>
          </div>
        </div>

        <div className="minecraft-card">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Icon name="plus" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{t.wiki?.forms?.create?.title || 'Create New Guide'}</h1>
                <p className="text-slate-600">{t.wiki?.forms?.create?.description || 'Create a comprehensive guide for the community'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <WikiForm 
              onSuccess={() => {
                router.push('/wiki')
              }}
              onCancel={() => {
                router.push('/wiki')
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}