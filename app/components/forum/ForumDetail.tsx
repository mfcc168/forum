'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
// import { usePermissions } from '@/lib/hooks/usePermissions';
import { Icon } from '@/app/components/ui/Icon';
import { ReplyForm } from '@/app/components/forum/ReplyForm';
import { ReplyList } from '@/app/components/forum/ReplyList';
import { ForumActions } from '@/app/components/forum/ForumActions';
import { sanitizeHtml } from '@/lib/utils/html';
import { formatSimpleDate } from '@/lib/utils';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import type { ForumPost, ForumReply } from '@/lib/types';

interface ForumDetailProps {
  post: ForumPost;
  replies: ForumReply[];
  currentUserId?: string;
  onPostDeleted?: () => void;
  onReplyAdded?: () => void;
}

export const ForumDetail = memo(function ForumDetail({ 
  post, 
  replies, 
  currentUserId, 
  onPostDeleted,
  onReplyAdded 
}: ForumDetailProps) {
  const { data: session } = useSession();
  // Permissions available for future features
  // const permissions = usePermissions(session, 'forum', post);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { t } = useTranslation();
  
  // Memoize translation function to prevent re-renders
  const translateCategoryName = useCallback((categoryName: string) => {
    return t.forum.categoryNames[categoryName as keyof typeof t.forum.categoryNames] || categoryName;
  }, [t]);


  const canReply = useMemo((): boolean => {
    return !!(session && !post.isLocked);
  }, [session, post.isLocked]);

  const handleReplySuccess = useCallback(() => {
    setShowReplyForm(false);
    // React Query will handle the cache updates automatically
    onReplyAdded?.();
  }, [onReplyAdded]);

  // Avatar will now be available from database

  return (
    <div className="w-full px-6">
      {/* Modern Breadcrumb Navigation */}
      <div className="minecraft-panel p-4 mb-6">
        <div className="flex items-center space-x-2 text-sm text-slate-700">
          <Link href="/forum" className="text-emerald-600 hover:text-emerald-700 font-medium">Forum</Link>
          <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
          <Link href={`/forum/category/${post.categoryName}`} className="text-emerald-600 hover:text-emerald-700 font-medium">{translateCategoryName(post.categoryName)}</Link>
          <Icon name="chevronRight" className="w-4 h-4 text-slate-400" />
          <span className="text-slate-800 font-medium truncate">{post.title}</span>
        </div>
      </div>


      {/* Main Post */}
      <div className="minecraft-card overflow-hidden mb-6">
        <div className="flex">
          {/* User Profile Sidebar */}
          <div className="bg-slate-50 border-r p-6 w-56 flex-shrink-0">
            <div className="text-center">
              {post.author?.avatar ? (
                <Image 
                  src={post.author.avatar!} 
                  alt={post.author?.name || 'Unknown User'}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg object-cover"
                  onError={(e) => {
                    // Hide the broken image and show fallback
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
                className={`fallback-avatar w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg ${post.author?.avatar ? 'hidden' : ''}`}
              >
                {(post.author?.name || 'Unknown User').charAt(0).toUpperCase()}
              </div>
              <div className="font-bold text-lg text-slate-800 mb-2">{post.author?.name || 'Unknown User'}</div>
              <div className="minecraft-badge mb-3">{t.forum.postDetail.sidebar.member}</div>
              
              <div className="text-sm text-slate-600 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="chat" className="w-4 h-4" />
                  <span>{t.forum.postDetail.sidebar.posts}: 42</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Icon name="clock" className="w-4 h-4" />
                  <span>{t.forum.postDetail.sidebar.joined} Jan 2024</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="mt-4 space-y-2">
                {post.isPinned && (
                  <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    📌 Pinned
                  </div>
                )}
                {post.isLocked && (
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    🔒 Locked
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="flex-1 p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-slate-800">{post.title}</h1>
                <span className="minecraft-badge">{translateCategoryName(post.categoryName)}</span>
              </div>
              <div className="text-xs text-slate-500 text-right">
                <div className="flex items-center justify-end space-x-3">
                  <div className="flex items-center space-x-1">
                    <Icon name="clock" className="w-3 h-3" />
                    <span>{formatSimpleDate(post.createdAt)}</span>
                  </div>
                  {post.createdAt !== post.updatedAt && (
                    <div className="flex items-center space-x-1">
                      <Icon name="edit" className="w-3 h-3" />
                      <span>{formatSimpleDate(post.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div 
              className="prose prose-lg max-w-none text-slate-700 leading-relaxed mb-6"
              style={{ fontSize: '16px', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg border hover:bg-slate-200 cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Section */}
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-6">
                <ForumActions
                  post={post}
                  compact={true}
                  onDelete={onPostDeleted}
                />
                
                {canReply && !showReplyForm && (
                  <button 
                    onClick={() => setShowReplyForm(true)}
                    className="minecraft-button px-4 py-2 text-sm flex items-center space-x-2"
                  >
                    <Icon name="chat" className="w-4 h-4" />
                    <span>{t.forum.postDetail.buttons.reply}</span>
                  </button>
                )}
              </div>

              {/* Reply Form or Auth Messages */}
              {showReplyForm && canReply && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">{t.forum.postDetail.buttons.writeReply}</h3>
                  <ReplyForm
                    postId={post.slug || post.id}
                    onSuccess={handleReplySuccess}
                    onCancel={() => setShowReplyForm(false)}
                  />
                </div>
              )}

              {!session && (
                <div className="mt-4 minecraft-panel p-4 bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <Icon name="user" className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-800">
                      <Link href="/login" className="text-blue-900 font-medium hover:underline">
                        Sign in
                      </Link>
                      {' '}to join the conversation
                    </p>
                  </div>
                </div>
              )}

              {post.isLocked && session && (
                <div className="mt-4 minecraft-panel p-4 bg-red-50">
                  <div className="flex items-center space-x-3">
                    <Icon name="lock" className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">This post is locked and cannot receive new replies.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies Section - Always render to handle optimistic updates */}
      <div className="p-6">
        <ReplyList 
          initialReplies={replies}
          postId={post.slug || post.id}
          currentUserId={currentUserId}
          canReply={canReply}
          onReplyAdded={onReplyAdded}
        />
      </div>

    </div>
  );
});