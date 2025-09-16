'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { Button } from '@/app/components/ui/Button';
import { CategoryFilter } from '@/app/components/ui/CategoryFilter';
import { SidebarCategoryFilter } from '@/app/components/ui/SidebarCategoryFilter';
import { SearchInput } from '@/app/components/shared';
import { ClientSearchFilter } from '@/app/components/shared/ClientSearchFilter';
import { useForumPosts } from '@/lib/hooks/useForum';
import { ForumList } from '@/app/components/forum/ForumList';
import type { ForumPost, ForumCategory } from '@/lib/types';
import type { ForumStats } from '@/lib/types/entities/stats';

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
  const [searchQuery, setSearchQuery] = useState('');
  
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
    sortBy: 'latest',
    status: 'active', // Active = published + not deleted + not locked
    initialData: safeInitialPosts
  });
  
  const forumPosts = forumQuery.data || safeInitialPosts;

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

  const isLoggedIn = !!session?.user;

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t.common.searchPlaceholder || 'Search forum posts...'}
            className="w-full"
            debounceMs={100}
          />
        </div>

        {/* Category Filter - Hidden in search mode */}
        {!isSearchMode && (
          <CategoryFilter
            categories={categoryFilterData}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            title={t.forum.filter.title}
            showCounts={true}
            allCategoryLabel={t.common.all}
          />
        )}

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


        {/* Client-Side Search Filter */}
        <ClientSearchFilter
          data={forumPosts}
          searchQuery={searchQuery}
          filters={{ category: selectedCategory }}
          searchFields={['title', 'content', 'excerpt']}
          categoryField="categoryName"
        >
          {(filteredPosts) => (
            <>
              {/* Search Results Header */}
              {isSearchMode && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Search Results for &ldquo;{searchQuery}&rdquo;
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {forumQuery.isLoading && !forumQuery.data && safeInitialPosts.length === 0 ? (
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
                    <Icon name={isSearchMode ? 'search' : 'messageCircle'} className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">
                    {isSearchMode
                      ? t.common.noResults || 'No search results'
                      : selectedCategory 
                        ? t.forum.emptyState?.noPostsInCategory?.replace('{category}', getCategoryName(selectedCategory)) || `No posts in ${getCategoryName(selectedCategory)}`
                        : t.forum.emptyState?.noPosts || 'No forum posts yet'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {isSearchMode
                      ? t.common.tryDifferentTerms || 'Try different search terms'
                      : selectedCategory 
                        ? t.forum.emptyState?.checkBack || 'Check back later for new posts'
                        : t.forum.emptyState?.checkBack || 'Check back later for new posts'}
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
                        : t.forum.sidebar?.viewAllPosts || 'View All Posts'
                      }
                    </Button>
                  )}
                </div>
              ) : (
                /* Forum Posts List */
                <ForumList 
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