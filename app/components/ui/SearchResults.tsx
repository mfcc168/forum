'use client'

import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'

interface SearchResult {
  id: string
  title: string
  type: 'blog' | 'forum' | 'wiki' | 'monster'
  excerpt?: string
  url: string
  category?: string
}

interface SearchResultsProps {
  results?: SearchResult[]
  isLoading?: boolean
  query?: string
  error?: string
}

export function SearchResults({ results = [], isLoading, query, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <EmptyState 
        title="No results found"
        description={`No results found for "${query}". Try different keywords.`}
      />
    )
  }

  if (results.length === 0) {
    return (
      <EmptyState 
        title="Start searching"
        description="Enter a search term to find content across the site."
      />
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog': return 'bg-blue-100 text-blue-800'
      case 'forum': return 'bg-green-100 text-green-800'
      case 'wiki': return 'bg-purple-100 text-purple-800'
      case 'monster': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
      </p>
      
      {results.map((result) => (
        <div key={result.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              <a href={result.url} className="hover:text-emerald-600">
                {result.title}
              </a>
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
              {result.type}
            </span>
          </div>
          
          {result.excerpt && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {result.excerpt}
            </p>
          )}
          
          {result.category && (
            <p className="text-xs text-gray-500">
              Category: {result.category}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}