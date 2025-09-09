import { NextRequest } from 'next/server'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export const runtime = 'nodejs'

/**
 * GET /api/server/stats
 * Get server statistics and status
 */
export const GET = withDALAndValidation(
  async (_request: NextRequest, { dal }: { dal: typeof DAL }) => {
    try {
      // Get server info (updated to use ServerInfo instead of ServerStats)
      const serverInfo = await dal.getServerInfo()
      
      if (!serverInfo) {
        return ApiResponse.error('No server info found', 404)
      }
      
      // Transform data for frontend
      const transformedStats = [
        { 
          label: 'onlinePlayers', 
          value: serverInfo.currentPlayers.toString(), 
          max: serverInfo.maxPlayers.toString(), 
          color: 'emerald' 
        },
        { 
          label: 'serverStatus', 
          value: serverInfo.status === 'online' ? 'Online' : serverInfo.status === 'offline' ? 'Offline' : 'Maintenance', 
          color: 'orange' 
        },
        { 
          label: 'serverVersion', 
          value: serverInfo.version, 
          color: 'blue' 
        },
        { 
          label: 'serverName', 
          value: serverInfo.name, 
          color: 'purple' 
        }
      ]
      
      return ApiResponse.success(transformedStats, 'Server statistics retrieved successfully')
    } catch (error) {
      console.error('Error fetching server stats:', error)
      return ApiResponse.error('Failed to fetch server stats', 500)
    }
  },
  {
    auth: 'optional',
    rateLimit: { requests: 60, window: '1m' }
  }
)