'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/app/components/ui/Icon'
import { BlogForm } from '@/app/components/blog/BlogForm'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { useBlogPost } from '@/lib/hooks/useBlog'
import type { BlogPost } from '@/lib/types'

interface EditBlogContentProps {
  initialPost: BlogPost
  slug: string
}

export default function EditBlogContent({ initialPost, slug }: EditBlogContentProps) {
  const router = useRouter()
  const { t } = useTranslation()
  
  // Use blog hook with initial data for client-side updates
  const { data: post } = useBlogPost(slug, { 
    enabled: false // Since we already have initial data
  })

  const currentPost = post || initialPost

  return (
    <div className="min-h-screen">
      <div className="w-full py-8 px-6">
        {/* Breadcrumb Navigation */}
        <div className="minecraft-panel p-4 mb-6">
          <div className="flex items-center space-x-2 text-sm text-slate-700">
            <Link href="/blog" className="text-emerald-600 hover:text-emerald-700 font-medium">{t.nav.blog}</Link>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
            <Link href={`/blog/${slug}`} className="text-emerald-600 hover:text-emerald-700 font-medium">{currentPost.title}</Link>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800 font-medium">{t.blog.forms.edit.title}</span>
          </div>
        </div>

        <div className="minecraft-card">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Icon name="edit" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{t.blog.forms.edit.title}</h1>
                <p className="text-slate-600">{t.blog.forms.edit.description}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <BlogForm 
              post={currentPost}
              onSuccess={() => {
                router.push('/blog')
              }}
              onCancel={() => router.push(`/blog/${slug}`)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}