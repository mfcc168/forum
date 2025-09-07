'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { Button } from '@/app/components/ui/Button';
import { CategoryFilter } from '@/app/components/ui/CategoryFilter';
import { SidebarCategoryFilter } from '@/app/components/ui/SidebarCategoryFilter';
import { SearchInput, SearchResultsHeader } from '@/app/components/shared/SearchInput';
import { useBlogPosts, useBlogSearch } from '@/lib/hooks/useBlog';
import { BlogList } from '@/app/components/blog/BlogList';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
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
  
  // Dedicated search hook (like wiki)
  const searchQuery_trimmed = searchQuery.trim()
  const searchResults = useBlogSearch(searchQuery_trimmed, {
    status: 'published',
    sortBy: 'latest'
  })
  
  const blogPosts = blogQuery.data || safeInitialPosts;

  // Determine if we're in search mode
  const isSearchMode = Boolean(searchQuery_trimmed);
  const displayPosts = isSearchMode ? (searchResults.data || []) : blogPosts;
  
  // Determine if we should show search results or loading
  // CRITICAL: Only show results when query is valid AND complete AND not loading
  const isQueryValid = !!searchQuery_trimmed && searchQuery_trimmed.length >= 1;
  const shouldShowSearchLoading = isSearchMode && (isSearching || (isQueryValid && searchResults.isLoading));
  const shouldShowSearchResults = isSearchMode && isQueryValid && !isSearching && !searchResults.isLoading;

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
    ? displayPosts.filter((post: BlogPost) => post?.category && post.category === selectedCategory)
    : displayPosts.filter((post: BlogPost) => post?.category !== null);

  // Use centralized permission system
  const permissions = usePermissions(session, 'blog');

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSearchStateChange={setIsSearching}
            placeholder={t.common.searchPlaceholder || 'Search blog posts...'}
            className="w-full"
            showSuggestions={true}
            debounceMs={200}
            module="blog"
          />
        </div>

        {/* Search Results Header */}
        {isSearchMode && (
          <SearchResultsHeader
            query={searchQuery}
            resultCount={searchResults.data?.length || 0}
            onClear={() => setSearchQuery('')}
            module="blog"
          />
        )}

        {/* Category Filter - Hidden in search mode */}
        {!isSearchMode && (
          <CategoryFilter
            categories={categoryFilterData}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            title={t.blog.filter.title}
            showCounts={true}
            allCategoryLabel={t.common.all}
          />
        )}

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
            isLoading: isSearchMode 
              ? shouldShowSearchLoading
              : (blogQuery.isLoading && !blogQuery.data && safeInitialPosts.length === 0),
            error: isSearchMode ? searchResults.error : blogQuery.error,
            refetch: isSearchMode ? searchResults.refetch : blogQuery.refetch
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
            title: isSearchMode
              ? t.common.noResults || 'No search results'
              : selectedCategory 
                ? t.blog.emptyState?.noPostsInCategory?.replace('{category}', getCategoryName(selectedCategory)) || `No posts in ${getCategoryName(selectedCategory)}`
                : t.blog.emptyState?.noPosts || 'No blog posts yet',
            description: isSearchMode
              ? t.common.tryDifferentTerms || 'Try different search terms'
              : selectedCategory 
                ? t.blog.emptyState?.checkBack || 'Check back later for new posts'
                : t.blog.emptyState?.checkBack || 'Check back later for new posts',
            icon: isSearchMode ? 'search' : 'document',
            variant: 'card',
            action: isSearchMode ? {
              label: t.common.clear || 'Clear Search',
              onClick: () => setSearchQuery('')
            } : selectedCategory ? {
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