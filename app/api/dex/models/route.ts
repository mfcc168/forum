import { NextRequest } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser, PermissionUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'
import { PermissionChecker } from '@/lib/utils/permissions'

// GET /api/dex/models - Get available GLTF model files
export const GET = withDALAndValidation(
  async (request: NextRequest, { user }: {
    user?: ServerUser;
    dal: typeof DAL;
  }) => {
    if (!user) {
      return ApiResponse.error('Authentication required', 401)
    }

    // Check permissions using centralized system
    const permissionUser: PermissionUser = { id: user.id, role: user.role }
    if (!PermissionChecker.canCreate(permissionUser, 'dex')) {
      return ApiResponse.error('You do not have permission to view models', 403)
    }

    try {
      const modelsDir = join(process.cwd(), 'public', 'models')
      const files = await readdir(modelsDir)
      
      // Filter for GLTF files and format for form consumption
      const modelOptions = files
        .filter(file => file.toLowerCase().endsWith('.gltf') || file.toLowerCase().endsWith('.glb'))
        .map(file => ({
          value: `/models/${file}`,
          label: file.replace(/\.(gltf|glb)$/i, '').replace(/[_-]/g, ' '),
          disabled: false
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      return ApiResponse.success(modelOptions, 'Models retrieved successfully')
    } catch (error) {
      console.error('Error reading models directory:', error)
      return ApiResponse.error('Failed to read models directory', 500)
    }
  },
  {
    auth: 'required',
    rateLimit: { requests: 30, window: '1m' }
  }
)