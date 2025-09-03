'use client';

import { useState, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { Card } from '@/app/components/ui/Card';
import { BlogActions } from './BlogActions';
import { getBlogCategoryColor } from '@/lib/config/blog-categories';
import { formatDateSimple, formatNumber } from '@/lib/utils';
import type { BlogPost } from '@/lib/types';

interface BlogDetailProps {
  post: BlogPost;
  showActions?: boolean;
  showMeta?: boolean;
  layout?: 'card' | 'page';
  currentUserId?: string;
  onPostDeleted?: () => void;
}

export const BlogDetail = memo(function BlogDetail({ 
  post, 
  showActions = true, 
  showMeta = true,
  layout = 'card',
  currentUserId: _currentUserId, // Reserved for future features
  onPostDeleted
}: BlogDetailProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [imageError, setImageError] = useState(false);

  // Memoize category name translation
  const getCategoryName = useCallback((category: string | null | undefined) => {
    if (!category) return 'Unknown';
    const categoryNames = t.blog?.categoryNames || {};
    return categoryNames[category as keyof typeof categoryNames] || 
           (category.charAt(0).toUpperCase() + category.slice(1));
  }, [t.blog?.categoryNames]);

  // Memoize image error handler
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);


  // Return full page layout for detail pages
  if (layout === 'page') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        {/* Header Section */}
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
                    {getCategoryName(post.category || 'blog')}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                  {post.title}
                </h1>

                {/* Excerpt */}
                <p className="text-lg text-emerald-100 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Header Meta Info */}
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Icon name="user" className="w-4 h-4 text-emerald-200" />
                      <span className="text-emerald-100">{post.author?.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="clock" className="w-4 h-4 text-emerald-200" />
                      <span className="text-emerald-100">{formatDateSimple(post.publishedAt || post.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="eye" className="w-4 h-4 text-emerald-200" />
                      <span className="text-emerald-100">{formatNumber(post.stats.viewsCount || 0)} views</span>
                    </div>
                    {(post.stats?.likesCount || 0) > 0 && (
                      <div className="flex items-center space-x-2">
                        <Icon name="thumbsUp" className="w-4 h-4 text-emerald-200" />
                        <span className="text-emerald-100">{formatNumber(post.stats?.likesCount || 0)} likes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Article Content */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
                <article className="p-8">
                  <div className="prose prose-xl prose-slate max-w-none">
                    {post.content ? (
                      <div 
                        className="text-slate-700 leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {post.excerpt || 'No content available'}
                      </p>
                    )}
                  </div>

                  {/* Tags Section */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-slate-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-6">Tags</h3>
                      <div className="flex flex-wrap gap-3">
                        {post.tags.map((tag, index) => (
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

              {/* Standardized Actions */}
              <Card className="p-6 bg-white rounded-2xl shadow-xl border border-slate-200/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Icon name="user" className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{t.blog.actions.title}</h3>
                </div>
                <BlogActions post={post} onDelete={onPostDeleted} />
              </Card>
            </div>

            {/* Sidebar */}
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
              {!session && (
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
                    {post.author?.avatar && !imageError ? (
                      <Image 
                        src={post.author.avatar} 
                        alt={post.author?.name || 'Anonymous'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {(post.author?.name || 'Anonymous').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{post.author?.name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-500">{t.blog.stats.author}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>{t.blog.stats.published}</span>
                      <span className="font-medium">{formatDateSimple(post.publishedAt || post.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t.blog.stats.views}</span>
                      <span className="font-medium">{formatNumber(post.stats?.viewsCount || 0)}</span>
                    </div>
                    {(post.stats?.likesCount || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span>{t.blog.stats.likes}</span>
                        <span className="font-medium">{formatNumber(post.stats?.likesCount || 0)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>{t.forum.categories.title}</span>
                      <span className="font-medium">{getCategoryName(post.category || 'blog')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return card layout for list views
  return (
    <article className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-6">
        {/* Category Badge */}
        {post.category && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${
              getBlogCategoryColor(post.category).bg
            } ${
              getBlogCategoryColor(post.category).text
            }`}>
              <span className="w-2 h-2 bg-current rounded-full mr-2 opacity-75"></span>
              {getCategoryName(post.category)}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Excerpt */}
        <p className="text-xl text-slate-600 leading-relaxed mb-6">
          {post.excerpt}
        </p>

        {/* Meta Information */}
        {showMeta && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-4">
              {/* Author */}
              <div className="flex items-center space-x-3">
                {post.author?.avatar && !imageError ? (
                  <Image 
                    src={post.author.avatar!} 
                    alt={post.author?.name || 'Unknown User'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {(post.author?.name || 'Anonymous').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">{post.author?.name || 'Anonymous'}</p>
                  <p className="text-sm text-slate-500">{t.blog.meta.author}</p>
                </div>
              </div>

              {/* Publication Date */}
              <div className="flex items-center space-x-2 text-slate-500">
                <Icon name="clock" className="w-4 h-4" />
                <span className="text-sm">
                  {formatDateSimple(post.publishedAt || post.createdAt)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Icon name="eye" className="w-4 h-4" />
                <span>{formatNumber(post.stats?.viewsCount || post.stats.viewsCount || 0)}</span>
              </div>
              {(post.stats?.likesCount || post.stats.likesCount || 0) > 0 && (
                <div className="flex items-center space-x-1">
                  <Icon name="thumbsUp" className="w-4 h-4" />
                  <span>{(post.stats?.likesCount || post.stats.likesCount || 0)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-8 pb-8">
        <div className="prose prose-xl prose-slate max-w-none">
          {post.content ? (
            <div 
              className="text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-slate-700 leading-relaxed text-lg">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">
              {t.blog.meta.tags}
            </h3>
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag, index) => (
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

        {/* Actions */}
        {showActions && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <BlogActions post={post} />
          </div>
        )}
      </div>
    </article>
  );
});