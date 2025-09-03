import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/utils/validation'
import { withDALAndValidation } from '@/lib/database/middleware'
import { z } from 'zod'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * Unified Stats Endpoint
 * 
 * Consolidates forum/blog/wiki stats into a single, consistent endpoint
 * Route: /api/stats/[module] where module = forum | blog | wiki
 */

const statsModuleSchema = z.object({
  module: z.enum(['forum', 'blog', 'wiki'])
})

export const GET = withDALAndValidation(
  async (request: NextRequest, { dal, params }: { dal: typeof DAL; params: Promise<{ module: string }> }) => {
    const { module } = await params
    
    // Validate module parameter
    const validation = statsModuleSchema.safeParse({ module })
    if (!validation.success) {
      return ApiResponse.error('Invalid module. Must be: forum, blog, or wiki', 400)
    }
    
    // Get stats using consistent DAL pattern
    let stats
    switch (module) {
      case 'forum':
        stats = await dal.forum.getStats()
        break
        
      case 'blog':
        stats = await dal.blog.getStats()
        break
        
      case 'wiki':
        stats = await dal.wiki.getStats()
        break
    }
    
    return ApiResponse.success(stats, `${module} stats retrieved successfully`)
  }
)