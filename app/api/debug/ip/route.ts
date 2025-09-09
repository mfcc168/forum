import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/validation'

export const runtime = 'nodejs'

/**
 * Debug endpoint to get Vercel's IP address
 * GET /api/debug/ip
 */
export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  // Try different ways to get the IP
  const ip = forwardedFor?.split(',')[0] || realIp || remoteAddr || 'unknown'
  
  return ApiResponse.success({
    ip,
    forwardedFor,
    realIp,
    remoteAddr,
    allHeaders: Object.fromEntries(request.headers.entries())
  }, 'IP information retrieved')
}