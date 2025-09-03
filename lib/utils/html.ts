export function stripHtmlTags(html: string): string {
  // Create a temporary DOM element to parse HTML
  if (typeof window !== 'undefined') {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }
  
  // Fallback for server-side rendering
  return html.replace(/<[^>]*>/g, '')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Import secure sanitizeHtml implementation from validation
export { sanitizeHtml } from './validation'