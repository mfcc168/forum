'use client';

import { memo } from 'react'
import { Icon } from '@/app/components/ui/Icon';

interface BlogPostProps {
  post: {
    id: number;
    title: string;
    excerpt: string;
    author: string;
    date: string;
    category: string;
    readTime: string;
  };
  isFeature?: boolean;
  translations: {
    likes: string;
    comments: string;
    readMore: string;
  };
}

export const BlogPost = memo(function BlogPost({ post, isFeature = false, translations }: BlogPostProps) {
  return (
    <article className={`minecraft-card overflow-hidden ${
      isFeature ? 'md:col-span-2 lg:col-span-3' : ''
    }`}>
      <div className="p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Icon name="document" className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="minecraft-badge mb-1">{post.category}</span>
              <div className="text-sm text-slate-500">{post.readTime}</div>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div>By <span className="font-medium text-slate-700">{post.author}</span></div>
            <div>{post.date}</div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-4 hover:text-emerald-600 transition-colors cursor-pointer">
          {post.title}
        </h2>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Icon name="thumbsUp" className="w-4 h-4 text-slate-400" />
              <span>24 {translations.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="chat" className="w-4 h-4 text-slate-400" />
              <span>8 {translations.comments}</span>
            </div>
          </div>
          <button className="minecraft-button px-6 py-2">
            {translations.readMore} →
          </button>
        </div>
      </div>
    </article>
  );
})