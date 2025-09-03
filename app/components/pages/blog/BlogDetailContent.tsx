'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BlogDetail } from '@/app/components/blog/BlogDetail';
import { useBlogPost } from '@/lib/hooks/useBlog';
import type { BlogPost } from '@/lib/types';

interface BlogDetailContentProps {
  slug: string;
  initialPost: BlogPost;
}

export function BlogDetailContent({ slug, initialPost }: BlogDetailContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Use blog hook with initial data for hydration
  const blogPostQuery = useBlogPost(slug, { 
    enabled: !!slug,
    initialData: initialPost,
    // Force refetch on mount to get authenticated interaction states
    refetchOnMount: true,
    // Keep initialData but mark it as stale to trigger refetch
    staleTime: 0
  });
  
  // Use query data if available (includes cache updates), fallback to initial SSR data
  const currentPost = blogPostQuery.data || initialPost;
  
  const handlePostDeleted = () => {
    router.push('/blog');
  };

  // Don't render if post is not available (handle server-side)
  if (!currentPost) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="w-full py-8">
        <BlogDetail
          post={currentPost}
          layout="page"
          currentUserId={session?.user?.id}
          onPostDeleted={handlePostDeleted}
        />
      </div>
    </div>
  );
}