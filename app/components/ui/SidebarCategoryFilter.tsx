'use client'

import React from 'react'
import { Icon } from '@/app/components/ui/Icon'

interface Category {
  id: string
  name: string
  displayName: string
  count?: number
}

interface SidebarCategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  title?: string
  showCounts?: boolean
  allPostsLabel?: string
  allPostsCount?: number
  iconName?: string
  className?: string
}

export function SidebarCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  title = 'Categories',
  showCounts = true,
  allPostsLabel = 'All Posts',
  allPostsCount = 0,
  iconName = 'folder',
  className = ''
}: SidebarCategoryFilterProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 sticky top-24 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
          <Icon name={iconName} className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {/* All Posts Option */}
        <button
          onClick={() => onCategoryChange('')}
          className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
            selectedCategory === ''
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{allPostsLabel}</span>
            {showCounts && (
              <span className={`text-xs ${selectedCategory === '' ? 'text-emerald-100' : 'text-slate-500'}`}>
                {allPostsCount}
              </span>
            )}
          </div>
        </button>
        
        {/* Category Options */}
        {categories.map((category) => {
          const isActive = selectedCategory === category.id
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {category.displayName}
                </span>
                {showCounts && category.count !== undefined && (
                  <span className={`text-xs ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {category.count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}