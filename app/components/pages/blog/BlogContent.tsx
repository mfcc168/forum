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
import { SearchInput, SearchResultsHeader } from '@/app/components/shared/SearchInput';
import { ClientSearchFilter } from '@/app/components/shared/ClientSearchFilter';
import { useBlogPosts } from '@/lib/hooks/useBlog';
import { BlogList } from '@/app/components/blog/BlogList';
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
    sortBy: 'latest',
    status: 'published',
    initialData: safeInitialPosts
  });
  
  const blogPosts = blogQuery.data || safeInitialPosts;

  // Determine if we're in search mode
  const isSearchMode = Boolean(searchQuery.trim());

  // Prepare categories for the CategoryFilter component
  const categoryFilterData = (safeInitialCategories || [])
    .filter(cat => cat && cat.name) // Remove null/undefined names and objects
    .map(cat => ({
      id: cat.name,
      name: cat.name,
      displayName: getCategoryName(cat.name),
      count: cat.stats?.postsCount || 0
    }));

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
            placeholder={t.common.searchPlaceholder || 'Search blog posts...'}
            className="w-full"
            showSuggestions={false}
            debounceMs={100}
            module="blog"
          />
        </div>

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


        {/* Client-Side Search Results Header */}
        <ClientSearchFilter
          data={blogPosts}
          searchQuery={searchQuery}
          filters={{ category: selectedCategory }}
          searchFields={['title', 'content', 'excerpt']}
          categoryField="category"
        >
          {(filteredPosts) => (
            <>
              {/* Search Results Header */}
              {isSearchMode && (
                <SearchResultsHeader
                  query={searchQuery}
                  resultCount={filteredPosts.length}
                  onClear={() => setSearchQuery('')}
                  module="blog"
                />
              )}

              {/* Loading State */}
              {blogQuery.isLoading && !blogQuery.data && safeInitialPosts.length === 0 ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-slate-200 rounded w-full"></div>
                            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <Icon name={isSearchMode ? 'search' : 'document'} className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">
                    {isSearchMode
                      ? t.common.noResults || 'No search results'
                      : selectedCategory 
                        ? t.blog.emptyState?.noPostsInCategory?.replace('{category}', getCategoryName(selectedCategory)) || `No posts in ${getCategoryName(selectedCategory)}`
                        : t.blog.emptyState?.noPosts || 'No blog posts yet'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {isSearchMode
                      ? t.common.tryDifferentTerms || 'Try different search terms'
                      : selectedCategory 
                        ? t.blog.emptyState?.checkBack || 'Check back later for new posts'
                        : t.blog.emptyState?.checkBack || 'Check back later for new posts'}
                  </p>
                  {(isSearchMode || selectedCategory) && (
                    <Button 
                      onClick={() => {
                        if (isSearchMode) setSearchQuery('')
                        if (selectedCategory) setSelectedCategory('')
                      }}
                      className="minecraft-button"
                    >
                      {isSearchMode 
                        ? t.common.clear || 'Clear Search'
                        : t.blog.sidebar?.viewAllPosts || 'View All Posts'
                      }
                    </Button>
                  )}
                </div>
              ) : (
                /* Blog Posts List */
                <BlogList 
                  posts={filteredPosts}
                  compact={false}
                  showCategory={true}
                  showExcerpt={true}
                />
              )}
            </>
          )}
        </ClientSearchFilter>
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