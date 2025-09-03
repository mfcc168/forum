import { ApiResponse } from '@/lib/utils/validation'
import { DAL } from '@/lib/database/dal'

export async function GET() {
  try {
      // Get server info (updated to use ServerInfo instead of ServerStats)
      const serverInfo = await DAL.getServerInfo()
      
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
      
      return ApiResponse.success(transformedStats)
    } catch (error) {
      console.error('Error fetching server stats:', error)
      return ApiResponse.error('Failed to fetch server stats', 500)
    }
}