'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { Card } from '@/app/components/ui/Card'
import { Icon } from '@/app/components/ui/Icon'
import { useBlogPost, useDeleteBlogPost } from '@/lib/hooks/useBlog'
import type { BlogPost } from '@/lib/types'

interface BlogDetailContentProps {
  slug: string
  initialPost: BlogPost
}

export default function BlogDetailContent({ slug, initialPost }: BlogDetailContentProps) {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  
  // Use blog hooks (consistent with forum)
  const { data: post } = useBlogPost(slug, { enabled: !!slug })
  const deletePostMutation = useDeleteBlogPost()
  
  const currentPost = post || initialPost
  const permissions = usePermissions(session, 'blog', currentPost)

  const getCategoryName = (category: string) => {
    const categoryNames = t.blog?.categoryNames || {};
    return categoryNames[category as keyof typeof categoryNames] || 
           category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleDeletePost = async () => {
    if (!confirm(t.blog.actions.confirmDelete)) {
      return
    }
    
    try {
      await deletePostMutation.mutateAsync(currentPost.slug)
      router.push('/blog')
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header Section - Reduced Height */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link 
              href="/blog" 
              className="inline-flex items-center space-x-2 text-emerald-100 hover:text-white transition-colors"
            >
              <Icon name="chevronRight" className="w-4 h-4 rotate-180" />
              <span className="text-sm font-medium">{t.blog.navigation.backToBlog}</span>
            </Link>
          </div>

          <div className="grid lg:grid-cols-4 gap-8 items-center">
            <div className="lg:col-span-3">
              {/* Category Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full mr-2"></span>
                  {getCategoryName(currentPost.category || 'blog')}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                {currentPost.title}
              </h1>

              {/* Excerpt */}
              <p className="text-lg text-emerald-100 leading-relaxed">
                {currentPost.excerpt}
              </p>
            </div>

            {/* Header Meta Info */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Icon name="user" className="w-4 h-4 text-emerald-200" />
                    <span className="text-emerald-100">{currentPost.author?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="clock" className="w-4 h-4 text-emerald-200" />
                    <span className="text-emerald-100">{new Date(currentPost.publishedAt || currentPost.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="eye" className="w-4 h-4 text-emerald-200" />
                    <span className="text-emerald-100">{(currentPost.stats.viewsCount || 0).toLocaleString()} views</span>
                  </div>
                  {(currentPost.stats.likesCount || 0) > 0 && (
                    <div className="flex items-center space-x-2">
                      <Icon name="thumbsUp" className="w-4 h-4 text-emerald-200" />
                      <span className="text-emerald-100">{(currentPost.stats.likesCount || 0)} likes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Wider Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Article Content */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
              <article className="p-8">
                <div className="prose prose-xl prose-slate max-w-none">
                  {currentPost.content ? (
                    <div 
                      className="text-slate-700 leading-relaxed text-lg"
                      dangerouslySetInnerHTML={{ __html: currentPost.content }}
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed text-lg">
                      {currentPost.excerpt}
                    </p>
                  )}
                </div>

                {/* Tags Section */}
                {currentPost.tags && currentPost.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6">Tags</h3>
                    <div className="flex flex-wrap gap-3">
                      {currentPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200/50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>

            {/* Admin Actions */}
            {(permissions.canEdit || permissions.canDelete) && (
              <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Icon name="user" className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{t.blog.actions.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Link href={`/blog/edit/${currentPost.slug}`}>
                    <button className="minecraft-button px-3 py-2 text-xs">
                      {t.blog.actions.editPost}
                    </button>
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    disabled={deletePostMutation.isPending}
                    className="minecraft-button px-3 py-2 text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletePostMutation.isPending ? t.blog.actions.deleting : t.blog.actions.deletePost}
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Navigation */}
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-xl border border-emerald-200/50 sticky top-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Icon name="link" className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{t.blog.sidebar.exploreMore}</h3>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/blog" 
                  className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                  <span className="font-medium">{t.blog.sidebar.allBlogPosts}</span>
                </Link>
                <Link 
                  href="/forum" 
                  className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                  <span className="font-medium">{t.blog.sidebar.communityForum}</span>
                </Link>
                <Link 
                  href="/wiki" 
                  className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                  <span className="font-medium">{t.blog.sidebar.serverWiki}</span>
                </Link>
              </div>
            </Card>

            {/* Notice for Regular Users */}
            {!(permissions.canEdit || permissions.canDelete) && (
              <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Icon name="star" className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{t.blog.adminNotice.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {t.blog.adminNotice.description}
                </p>
              </Card>
            )}

            {/* Article Info Card */}
            <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-4">{t.blog.sidebar.articleInfo}</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {currentPost.author?.avatar ? (
                    <Image 
                      src={currentPost.author.avatar!} 
                      alt={currentPost.author?.name || 'Anonymous'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const fallback = img.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                        img.style.display = 'none';
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`fallback-avatar w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${currentPost.author?.avatar ? 'hidden' : ''}`}
                  >
                    {currentPost.author?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{currentPost.author?.name}</p>
                    <p className="text-sm text-slate-500">{t.blog.stats.author}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>{t.blog.stats.published}</span>
                    <span className="font-medium">{new Date(currentPost.publishedAt || currentPost.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t.blog.stats.views}</span>
                    <span className="font-medium">{(currentPost.stats.viewsCount || 0).toLocaleString()}</span>
                  </div>
                  {(currentPost.stats.likesCount || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span>{t.blog.stats.likes}</span>
                      <span className="font-medium">{(currentPost.stats.likesCount || 0)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>{t.forum.categories.title}</span>
                    <span className="font-medium">{getCategoryName(currentPost.category || 'blog')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}