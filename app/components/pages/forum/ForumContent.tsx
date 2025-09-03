'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { Button } from '@/app/components/ui/Button';
import { CategoryFilter } from '@/app/components/ui/CategoryFilter';
import { SidebarCategoryFilter } from '@/app/components/ui/SidebarCategoryFilter';
import { useForumPosts } from '@/lib/hooks/useForum';
import { ForumList } from '@/app/components/forum/ForumList';
import { ListRenderer } from '@/app/components/ui/StateRenderer';
import type { ForumPost, ForumStatsResponse as ForumStats, ForumCategory } from '@/lib/types';

interface ForumContentProps {
  initialPosts?: ForumPost[]
  initialCategories?: ForumCategory[]
  initialStats?: ForumStats
}

export function ForumContent({ 
  initialPosts = [], 
  initialCategories = []
}: ForumContentProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Ensure initial posts is always an array
  const safeInitialPosts = Array.isArray(initialPosts) ? initialPosts : [];
  const safeInitialCategories = Array.isArray(initialCategories) ? initialCategories : [];
  
  // Define category name helper function
  const getCategoryName = (category: string | null | undefined) => {
    if (!category) return 'Unknown';
    const categoryNames = t.forum?.categoryNames || {};
    return categoryNames[category as keyof typeof categoryNames] || 
           (category.charAt(0).toUpperCase() + category.slice(1));
  };
  
  // Use forum hooks with initial data for hydration (consistent with wiki pattern)
  const forumQuery = useForumPosts({
    category: selectedCategory || undefined,
    sortBy: 'latest',
    status: 'active',
    initialData: safeInitialPosts
  });
  
  const forumPosts = forumQuery.data || safeInitialPosts;

  // Prepare categories for the CategoryFilter component
  const categoryFilterData = (safeInitialCategories || [])
    .filter(cat => cat && cat.name) // Remove null/undefined names and objects
    .map(cat => ({
      id: cat.name,
      name: cat.name,
      displayName: getCategoryName(cat.name),
      count: cat.stats?.postsCount || 0
    }));
  

  const filteredPosts = selectedCategory
    ? forumPosts.filter((post: ForumPost) => post?.categoryName && post.categoryName === selectedCategory)
    : forumPosts.filter((post: ForumPost) => post?.categoryName !== null);

  const isLoggedIn = !!session?.user;

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Category Filter */}
        <CategoryFilter
          categories={categoryFilterData}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          title={t.forum.filter.title}
          showCounts={true}
          allCategoryLabel={t.common.all}
        />

        {/* Create Post Button */}
        {isLoggedIn && (
          <div className="mb-6">
            <Link href="/forum/create">
              <Button className="minecraft-button">
                <Icon name="plus" className="w-4 h-4 mr-2" />
                {t.forum.actions.createPost}
              </Button>
            </Link>
          </div>
        )}

        {/* Forum Posts with Consistent State Management */}
        <ListRenderer
          state={{
            data: filteredPosts,
            isLoading: forumQuery.isLoading && !forumQuery.data && safeInitialPosts.length === 0,
            error: forumQuery.error,
            refetch: forumQuery.refetch
          }}
          loading={{
            variant: 'skeleton',
            layout: 'list',
            count: 3,
            message: 'Loading forum posts...'
          }}
          error={{
            variant: 'card',
            onRetry: forumQuery.refetch,
            showReload: true
          }}
          empty={{
            title: selectedCategory 
              ? t.forum.emptyState?.noPostsInCategory?.replace('{category}', getCategoryName(selectedCategory)) || `No posts in ${getCategoryName(selectedCategory)}`
              : t.forum.emptyState?.noPosts || 'No forum posts yet',
            description: selectedCategory 
              ? t.forum.emptyState?.checkBack || 'Check back later for new posts'
              : t.forum.emptyState?.checkBack || 'Check back later for new posts',
            icon: 'messageCircle',
            variant: 'card',
            action: selectedCategory ? {
              label: t.forum.sidebar?.viewAllPosts || 'View All Posts',
              onClick: () => setSelectedCategory('')
            } : undefined
          }}
        >
          <ForumList 
            posts={filteredPosts}
            compact={false}
            showCategory={true}
            showExcerpt={true}
          />
        </ListRenderer>
      </div>

      {/* Enhanced Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Categories Sidebar */}
        <SidebarCategoryFilter
          categories={categoryFilterData}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          title={t.forum.sidebar.categories}
          allPostsLabel={t.common.allPosts}
          allPostsCount={forumPosts.length}
          iconName="folder"
          showCounts={true}
        />

        {/* Member Notice for non-logged-in users */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Icon name="user" className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t.forum.memberNotice.title}</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {t.forum.memberNotice.description}
            </p>
            <Link href="/login">
              <Button className="minecraft-button w-full">
                {t.common.login}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}