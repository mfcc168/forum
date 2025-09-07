'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useTranslation } from '@/lib/contexts/LanguageContext'
import { Card } from '@/app/components/ui/Card'
import { Icon } from '@/app/components/ui/Icon'
import { getForumCategoryColor } from '@/lib/config/forum-categories'
import { formatSimpleDate, formatNumber } from '@/lib/utils'
import type { ForumPost as ForumPostType } from '@/lib/types'

interface ForumPostProps {
  post: ForumPostType
  compact?: boolean
  showCategory?: boolean
  showActions?: boolean
}

export function ForumPost({ 
  post, 
  compact = false, 
  showCategory = true, 
  showActions = false 
}: ForumPostProps) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const [imageError, setImageError] = useState(false)

  const getCategoryName = (category: string | null | undefined) => {
    if (!category) return 'Unknown'
    const categoryNames = t.forum?.categoryNames || {}
    return categoryNames[category as keyof typeof categoryNames] || 
           (category.charAt(0).toUpperCase() + category.slice(1))
  }

  // Use centralized permission system
  const permissions = usePermissions(session, 'forum', post)
  const isLoggedIn = !!session?.user

  if (compact) {
    return (
      <Link href={`/forum/${post.slug}`}>
        <Card className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {post.author?.avatar && !imageError ? (
                <Image 
                  src={post.author.avatar} 
                  alt={post.author?.name || 'Unknown User'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {(post.author?.name || 'A').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                {post.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-slate-500 mt-1">
                <span>{post.author?.name || 'Anonymous'}</span>
                <span>•</span>
                <span>{formatSimpleDate(post.createdAt)}</span>
                {showCategory && post.categoryName && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">{getCategoryName(post.categoryName)}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Icon name="messageCircle" className="w-4 h-4" />
                <span>{post.stats?.repliesCount || post.stats.repliesCount || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="eye" className="w-4 h-4" />
                <span>{formatNumber(post.stats?.viewsCount || post.stats.viewsCount || 0)}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  return (
    <article className="group">
      <Link href={`/forum/${post.slug}`} className="block">
        <Card className="overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          {/* Pinned/Locked Indicators */}
          {(post.isPinned || post.isLocked) && (
            <div className={`px-6 py-3 ${post.isPinned ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}>
              <div className="flex items-center space-x-2">
                <Icon name={post.isPinned ? "star" : "lock"} className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-semibold">
                  {post.isPinned ? t.forum.post.pinned : t.forum.post.locked}
                </span>
              </div>
            </div>
          )}
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {showCategory && post.categoryName && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    getForumCategoryColor(post.categoryName || 'general').bg
                  } ${
                    getForumCategoryColor(post.categoryName || 'general').text
                  }`}>
                    {getCategoryName(post.categoryName)}
                  </span>
                )}
                <div className="flex items-center space-x-1 text-slate-500">
                  <Icon name="clock" className="w-4 h-4" />
                  <span className="text-sm">{formatSimpleDate(post.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                <span className="text-sm font-medium">{t.forum.post.readMore}</span>
                <Icon name="chevronRight" className="w-4 h-4" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
              {post.title}
            </h3>
            
            <p className="text-slate-600 leading-relaxed mb-6 text-lg line-clamp-3">
              {post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : ''}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                {post.author.avatar && !imageError ? (
                  <Image 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {(post.author.name || 'Anonymous').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {post.author.name || 'Anonymous'}
                  </p>
                  <p className="text-slate-500 text-xs">{t.forum.post.author}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <Icon name="eye" className="w-4 h-4" />
                  <span>{formatNumber(post.stats?.viewsCount || post.stats.viewsCount || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="messageCircle" className="w-4 h-4" />
                  <span>{post.stats?.repliesCount || post.stats.repliesCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="thumbsUp" className="w-4 h-4" />
                  <span>{post.stats?.likesCount || post.stats.likesCount || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
      
      {/* Actions (if enabled) */}
      {showActions && isLoggedIn && permissions.canEdit && (
        <div className="mt-4 flex justify-end space-x-2">
          <Link href={`/forum/edit/${post.slug || post.id}`}>
            <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              {t.forum.actions.edit}
            </button>
          </Link>
          {permissions.canDelete && (
            <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
              {t.forum.actions.delete}
            </button>
          )}
        </div>
      )}
    </article>
  )
}