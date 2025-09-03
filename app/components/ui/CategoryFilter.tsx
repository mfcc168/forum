'use client'

import React from 'react'

interface Category {
  id: string
  name: string
  displayName: string
  count?: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  title?: string
  showCounts?: boolean
  variant?: 'default' | 'compact'
  className?: string
  allCategoryLabel?: string
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  title = 'Filter by Category',
  showCounts = false,
  variant = 'default',
  className = '',
  allCategoryLabel = 'All'
}: CategoryFilterProps) {
  const allCategories: Category[] = [
    { id: '', name: 'all', displayName: allCategoryLabel },
    ...categories
  ]

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {allCategories.map((category) => (
          <button
            key={category.id || category.name}
            onClick={() => onCategoryChange(category.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
            }`}
          >
            {category.displayName}
            {showCounts && category.count !== undefined && (
              <span className="ml-1 opacity-75">({category.count})</span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`mb-8 ${className}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="flex flex-wrap items-center gap-3">
          {allCategories.map((category) => (
            <button
              key={category.id || category.name}
              onClick={() => onCategoryChange(category.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
              }`}
            >
              {category.displayName}
              {showCounts && category.count !== undefined && (
                <span className={`ml-2 text-xs ${
                  selectedCategory === category.id ? 'text-emerald-100' : 'text-slate-500'
                }`}>
                  {category.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}