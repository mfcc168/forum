'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ForumDetail } from '@/app/components/forum/ForumDetail';
import { useForumPost } from '@/lib/hooks/useForum';
import type { ForumPost, ForumReply } from '@/lib/types';

interface ForumDetailContentProps {
  slug: string;
  initialPost: ForumPost;
  initialReplies: ForumReply[];
}

export function ForumDetailContent({ 
  slug,
  initialPost, 
  initialReplies
}: ForumDetailContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Use forum hook with initial data for hydration
  const forumPostQuery = useForumPost(slug, {
    enabled: !!slug,
    initialData: initialPost,
    // Force refetch on mount to get authenticated interaction states
    refetchOnMount: true,
    // Keep initialData but mark it as stale to trigger refetch
    staleTime: 0
  });
  
  // Use query data if available (includes cache updates), fallback to initial SSR data
  const currentPost = forumPostQuery.data || initialPost;
  
  const handlePostDeleted = () => {
    router.push('/forum');
  };

  const handleReplyAdded = () => {
    // React Query automatically refetches replies through cache invalidation
    // No need to manually reload data
  };

  // Don't render if post is not available (handle server-side)
  if (!currentPost) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="w-full py-8">
        <ForumDetail
          post={currentPost}
          replies={initialReplies}
          currentUserId={session?.user?.id}
          onPostDeleted={handlePostDeleted}
          onReplyAdded={handleReplyAdded}
        />
      </div>
    </div>
  );
}