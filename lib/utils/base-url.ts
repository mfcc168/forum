/**
 * Get the correct base URL for server-side data fetching
 * 
 * During build time and development: Use localhost
 * During production runtime: Use deployed URL
 */
export function getBaseUrl(): string {
  // During build or development, always use localhost
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === undefined) {
    return 'http://localhost:3000'
  }
  
  // In production runtime, use the deployed URL
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}