// Simple in-memory rate limiter (for production, use Redis or similar)

interface RateLimitRecord {
  count: number
  resetTime: number
}

class InMemoryRateLimit {
  private cache = new Map<string, RateLimitRecord>()
  private readonly defaultRequests = 100
  private readonly defaultWindow = 60 * 1000 // 1 minute

  async limit(
    identifier: string,
    requests = this.defaultRequests,
    window = this.defaultWindow
  ) {
    const now = Date.now()
    const key = `${identifier}:${Math.floor(now / window)}`
    
    const current = this.cache.get(key)
    
    if (!current) {
      this.cache.set(key, { count: 1, resetTime: now + window })
      this.cleanup()
      return {
        success: true,
        limit: requests,
        remaining: requests - 1,
        reset: now + window
      }
    }
    
    if (current.count >= requests) {
      return {
        success: false,
        limit: requests,
        remaining: 0,
        reset: current.resetTime
      }
    }
    
    current.count++
    this.cache.set(key, current)
    
    return {
      success: true,
      limit: requests,
      remaining: requests - current.count,
      reset: current.resetTime
    }
  }
  
  private cleanup() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (value.resetTime < now) {
        this.cache.delete(key)
      }
    }
  }
}

export const ratelimit = new InMemoryRateLimit()