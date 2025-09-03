'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { Button } from '@/app/components/ui/Button';
import { CategoryFilter } from '@/app/components/ui/CategoryFilter';
import { SidebarCategoryFilter } from '@/app/components/ui/SidebarCategoryFilter';
import { useBlogPosts } from '@/lib/hooks/useBlog';
import { BlogList } from '@/app/components/blog/BlogList';
;
import { ListRenderer } from '@/app/components/ui/StateRenderer';
import type { BlogPost, BlogStats, BlogCategory } from '@/lib/types';

interface BlogContentProps {
  initialPosts?: BlogPost[]
  initialCategories?: BlogCategory[]
  initialStats?: BlogStats
}

export function BlogContent({ 
  initialPosts = [], 
  initialCategories = []
}: BlogContentProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Ensure initial posts is always an array
  const safeInitialPosts = Array.isArray(initialPosts) ? initialPosts : []
  const safeInitialCategories = Array.isArray(initialCategories) ? initialCategories : []
  
  // Define category name helper function
  const getCategoryName = (category: string | null | undefined) => {
    if (!category) return 'Unknown';
    const categoryNames = t.blog?.categoryNames || {};
    return categoryNames[category as keyof typeof categoryNames] || 
           (category.charAt(0).toUpperCase() + category.slice(1));
  };
  
  // Use blog hooks with initial data for hydration (consistent with wiki pattern)
  const blogQuery = useBlogPosts({
    category: selectedCategory || undefined,
    sortBy: 'latest',
    status: 'published',
    initialData: safeInitialPosts
  });
  
  const blogPosts = blogQuery.data || safeInitialPosts;

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
    ? blogPosts.filter((post: BlogPost) => post?.category && post.category === selectedCategory)
    : blogPosts.filter((post: BlogPost) => post?.category !== null);

  // Use centralized permission system
  const permissions = usePermissions(session, 'blog');

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Category Filter */}
        <CategoryFilter
          categories={categoryFilterData}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          title={t.blog.filter.title}
          showCounts={true}
          allCategoryLabel={t.common.all}
        />

        {/* Create Post Button */}
        {permissions.canCreate && (
          <div className="mb-6">
            <Link href="/blog/create">
              <Button className="minecraft-button">
                <Icon name="plus" className="w-4 h-4 mr-2" />
                {t.blog.forms?.create?.submitButton || 'Create Blog Post'}
              </Button>
            </Link>
          </div>
        )}

        {/* Blog Posts - Standard List (consistent with forum/wiki) */}
        <ListRenderer
          state={{
            data: filteredPosts,
            isLoading: blogQuery.isLoading && !blogQuery.data && safeInitialPosts.length === 0,
            error: blogQuery.error,
            refetch: blogQuery.refetch
          }}
          loading={{
            variant: 'skeleton',
            layout: 'list',
            count: 3,
            message: t.blog.loading || 'Loading blog posts...'
          }}
          error={{
            variant: 'card',
            onRetry: blogQuery.refetch,
            showReload: true
          }}
          empty={{
            title: selectedCategory 
              ? t.blog.emptyState?.noPostsInCategory?.replace('{category}', getCategoryName(selectedCategory)) || `No posts in ${getCategoryName(selectedCategory)}`
              : t.blog.emptyState?.noPosts || 'No blog posts yet',
            description: selectedCategory 
              ? t.blog.emptyState?.checkBack || 'Check back later for new posts'
              : t.blog.emptyState?.checkBack || 'Check back later for new posts',
            icon: 'document',
            variant: 'card',
            action: selectedCategory ? {
              label: t.blog.sidebar?.viewAllPosts || 'View All Posts',
              onClick: () => setSelectedCategory('')
            } : undefined
          }}
        >
          <BlogList 
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
          title={t.blog.sidebar.categories}
          allPostsLabel={t.common.allPosts}
          allPostsCount={blogPosts.length}
          iconName="folder"
          showCounts={true}
        />


        {/* Admin Notice for non-admin users */}
        {!permissions.canCreate && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Icon name="star" className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t.blog.adminNotice.title}</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.blog.adminNotice.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}