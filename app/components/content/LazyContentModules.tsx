'use client'

import { Suspense, lazy, ComponentProps } from 'react'
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner'

// Lazy load content modules for better code splitting
const BlogForm = lazy(() => 
  import('@/app/components/blog/BlogForm').then(mod => ({ default: mod.BlogForm }))
)

const WikiForm = lazy(() => 
  import('@/app/components/wiki/WikiForm').then(mod => ({ default: mod.WikiForm }))
)

const ForumForm = lazy(() => 
  import('@/app/components/forum/ForumForm').then(mod => ({ default: mod.ForumForm }))
)

const BlogList = lazy(() => 
  import('@/app/components/blog/BlogList').then(mod => ({ default: mod.BlogList }))
)

const WikiList = lazy(() => 
  import('@/app/components/wiki/WikiList').then(mod => ({ default: mod.WikiList }))
)

const ForumList = lazy(() => 
  import('@/app/components/forum/ForumList').then(mod => ({ default: mod.ForumList }))
)

const BlogDetail = lazy(() => 
  import('@/app/components/blog/BlogDetail').then(mod => ({ default: mod.BlogDetail }))
)

const WikiDetail = lazy(() => 
  import('@/app/components/wiki/WikiDetail').then(mod => ({ default: mod.WikiDetail }))
)

const ForumDetail = lazy(() => 
  import('@/app/components/forum/ForumDetail').then(mod => ({ default: mod.ForumDetail }))
)

// Loading fallback component
function ContentLoadingFallback({ type }: { type?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-2 text-sm text-slate-600">
          Loading {type || 'content'}...
        </p>
      </div>
    </div>
  )
}

// Form-specific loading fallback
function FormLoadingFallback() {
  return (
    <div className="minecraft-card p-6">
      <div className="animate-pulse space-y-6">
        {/* Title field */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-16"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
        
        {/* Content field */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-20"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
        
        {/* Category field */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-10 bg-slate-200 rounded w-48"></div>
        </div>
        
        {/* Tags field */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-12"></div>
          <div className="h-10 bg-slate-200 rounded"></div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <div className="h-10 bg-slate-200 rounded w-20"></div>
          <div className="h-10 bg-slate-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}

// List-specific loading fallback
function ListLoadingFallback() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="minecraft-card p-6 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-6 bg-slate-200 rounded w-16"></div>
                <div className="h-6 bg-slate-200 rounded w-12"></div>
                <div className="h-6 bg-slate-200 rounded w-14"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Wrapped components with Suspense boundaries
export const LazyBlogForm = (props: ComponentProps<typeof BlogForm>) => (
  <Suspense fallback={<FormLoadingFallback />}>
    <BlogForm {...props} />
  </Suspense>
)

export const LazyWikiForm = (props: ComponentProps<typeof WikiForm>) => (
  <Suspense fallback={<FormLoadingFallback />}>
    <WikiForm {...props} />
  </Suspense>
)

export const LazyForumForm = (props: ComponentProps<typeof ForumForm>) => (
  <Suspense fallback={<FormLoadingFallback />}>
    <ForumForm {...props} />
  </Suspense>
)

export const LazyBlogList = (props: ComponentProps<typeof BlogList>) => (
  <Suspense fallback={<ListLoadingFallback />}>
    <BlogList {...props} />
  </Suspense>
)

export const LazyWikiList = (props: ComponentProps<typeof WikiList>) => (
  <Suspense fallback={<ListLoadingFallback />}>
    <WikiList {...props} />
  </Suspense>
)

export const LazyForumList = (props: ComponentProps<typeof ForumList>) => (
  <Suspense fallback={<ListLoadingFallback />}>
    <ForumList {...props} />
  </Suspense>
)

export const LazyBlogDetail = (props: ComponentProps<typeof BlogDetail>) => (
  <Suspense fallback={<ContentLoadingFallback type="blog post" />}>
    <BlogDetail {...props} />
  </Suspense>
)

export const LazyWikiDetail = (props: ComponentProps<typeof WikiDetail>) => (
  <Suspense fallback={<ContentLoadingFallback type="guide" />}>
    <WikiDetail {...props} />
  </Suspense>
)

export const LazyForumDetail = (props: ComponentProps<typeof ForumDetail>) => (
  <Suspense fallback={<ContentLoadingFallback type="forum post" />}>
    <ForumDetail {...props} />
  </Suspense>
)

// Module factory for dynamic loading
export const ContentModuleFactory = {
  BlogForm: LazyBlogForm,
  WikiForm: LazyWikiForm, 
  ForumForm: LazyForumForm,
  BlogList: LazyBlogList,
  WikiList: LazyWikiList,
  ForumList: LazyForumList,
  BlogDetail: LazyBlogDetail,
  WikiDetail: LazyWikiDetail,
  ForumDetail: LazyForumDetail,
}

export default ContentModuleFactory