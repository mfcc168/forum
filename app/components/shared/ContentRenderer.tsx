'use client'

import { memo, useMemo } from 'react'
import { sanitizeHtml } from '@/lib/utils/validation'

export interface ContentRendererProps {
  /** HTML content to render */
  content: string
  
  /** Content type for specific processing */
  contentType?: 'html' | 'markdown' | 'plaintext' | 'excerpt'
  
  /** Maximum length for truncation */
  maxLength?: number
  
  /** Show "read more" link when truncated */
  showReadMore?: boolean
  
  /** Read more link text */
  readMoreText?: string
  
  /** Read more click handler */
  onReadMoreClick?: () => void
  
  /** CSS classes for the container */
  className?: string
  
  /** Enable syntax highlighting for code blocks */
  enableSyntaxHighlighting?: boolean
  
  /** Custom link processing */
  processLinks?: boolean
  
  /** Open links in new tab */
  openLinksInNewTab?: boolean
  
  
  /** Line break handling */
  preserveLineBreaks?: boolean
  
  /** Highlight search terms */
  highlightTerms?: string[]
  
  /** Custom CSS classes for highlighted terms */
  highlightClassName?: string
}

export const ContentRenderer = memo(function ContentRenderer({
  content,
  contentType = 'html',
  maxLength,
  showReadMore = true,
  readMoreText = 'Read more',
  onReadMoreClick,
  className = '',
  enableSyntaxHighlighting, // Reserved for future syntax highlighting feature
  processLinks = true,
  openLinksInNewTab = false,
  preserveLineBreaks = false,
  highlightTerms = [],
  highlightClassName = 'bg-yellow-200 px-1 rounded'
}: ContentRendererProps) {
  
  // Process content based on type and options
  const processedContent = useMemo(() => {
    if (!content) return ''
    
    let processed = content
    
    // Handle different content types
    switch (contentType) {
      case 'plaintext':
        // Escape HTML and preserve line breaks if requested
        processed = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
        
        if (preserveLineBreaks) {
          processed = processed.replace(/\n/g, '<br>')
        }
        break
        
      case 'excerpt':
        // Strip HTML tags for excerpts
        processed = content.replace(/<[^>]*>/g, '')
        break
        
      case 'markdown':
        // Basic markdown processing (you might want to use a proper markdown parser)
        processed = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
          .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
          .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3
          .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2
          .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1
        break
        
      case 'html':
      default:
        // HTML content - will be sanitized below
        break
    }
    
    // Highlight search terms
    if (highlightTerms.length > 0) {
      highlightTerms.forEach(term => {
        if (term.trim()) {
          const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
          processed = processed.replace(regex, `<mark class="${highlightClassName}">$1</mark>`)
        }
      })
    }
    
    // Truncate if necessary
    if (maxLength && processed.length > maxLength) {
      const truncated = processed.substring(0, maxLength)
      const lastSpace = truncated.lastIndexOf(' ')
      const cutPoint = lastSpace > maxLength * 0.8 ? lastSpace : maxLength
      processed = truncated.substring(0, cutPoint) + '...'
    }
    
    // Process links
    if (processLinks && contentType !== 'plaintext') {
      if (openLinksInNewTab) {
        processed = processed.replace(
          /<a\s+([^>]*href=[^>]*)>/gi,
          '<a $1 target="_blank" rel="noopener noreferrer">'
        )
      }
      
      // Add security attributes to all links
      processed = processed.replace(
        /<a\s+([^>]*href=[^>]*)>/gi,
        '<a $1 rel="noopener noreferrer">'
      )
    }
    
    return processed
  }, [
    content, 
    contentType, 
    maxLength, 
    highlightTerms, 
    highlightClassName,
    processLinks,
    openLinksInNewTab,
    preserveLineBreaks
  ])
  
  // Sanitize HTML content using centralized utility
  const sanitizedContent = useMemo(() => {
    if (contentType === 'plaintext') {
      return processedContent
    }
    
    // Use the centralized sanitizeHtml function
    // Note: The centralized function has predefined safe tags/attributes
    // For more customization needs, we could extend the utility function
    return sanitizeHtml(processedContent)
  }, [processedContent, contentType])
  
  // Additional CSS classes for content styling
  const contentClasses = [
    'prose prose-slate max-w-none',
    'prose-headings:text-slate-800 prose-headings:font-bold',
    'prose-p:text-slate-600 prose-p:leading-relaxed',
    'prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline',
    'prose-strong:text-slate-800 prose-strong:font-semibold',
    'prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
    'prose-blockquote:border-emerald-200 prose-blockquote:bg-emerald-50 prose-blockquote:p-4 prose-blockquote:rounded',
    'prose-ul:list-disc prose-ol:list-decimal',
    'prose-img:rounded-lg prose-img:shadow-sm',
    className
  ].filter(Boolean).join(' ')
  
  // Handle empty content
  if (!sanitizedContent || String(sanitizedContent).trim() === '') {
    return (
      <div className={`text-slate-400 italic ${className}`}>
        No content available
      </div>
    )
  }
  
  // Render content
  const contentElement = (
    <div 
      className={contentClasses}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
  
  // Add read more functionality if content was truncated
  const wasTruncated = maxLength && content.length > maxLength
  
  if (wasTruncated && showReadMore) {
    return (
      <div className="space-y-3">
        {contentElement}
        
        <button
          type="button"
          onClick={onReadMoreClick}
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:underline transition-colors"
        >
          {readMoreText}
        </button>
      </div>
    )
  }
  
  return contentElement
})

// Utility function for extracting plain text
export const extractPlainText = (html: string, maxLength?: number): string => {
  const text = html.replace(/<[^>]*>/g, '').trim()
  
  if (maxLength && text.length > maxLength) {
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    const cutPoint = lastSpace > maxLength * 0.8 ? lastSpace : maxLength
    return truncated.substring(0, cutPoint) + '...'
  }
  
  return text
}

// Utility function for generating excerpts
export const generateExcerpt = (content: string, maxLength: number = 200): string => {
  return extractPlainText(content, maxLength)
}

// Utility function for counting words
export const countWords = (content: string): number => {
  const text = extractPlainText(content)
  return text.split(/\s+/).filter(word => word.length > 0).length
}

// Utility function for estimated reading time
export const getReadingTime = (content: string, wordsPerMinute: number = 200): string => {
  const words = countWords(content)
  const minutes = Math.ceil(words / wordsPerMinute)
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

export default ContentRenderer