import { NextRequest } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { withDALAndValidation } from '@/lib/database/middleware'
import { ApiResponse } from '@/lib/utils/validation'
import type { ServerUser } from '@/lib/types'
import { DAL } from '@/lib/database/dal'

// GET /api/dex/models - Get available GLTF model files
export const GET = withDALAndValidation(
  async (request: NextRequest, { user }: {
    user?: ServerUser;
    dal: typeof DAL;
  }) => {
    // Only allow admins to see available models for creation
    if (!user || user.role !== 'admin') {
      return ApiResponse.error('Access denied. Admin only.', 403)
    }

    try {
      const modelsDir = join(process.cwd(), 'public', 'models')
      const files = await readdir(modelsDir)
      
      // Filter for GLTF files only
      const gltfFiles = files
        .filter(file => file.toLowerCase().endsWith('.gltf') || file.toLowerCase().endsWith('.glb'))
        .map(file => ({
          name: file,
          path: `/models/${file}`,
          displayName: file.replace(/\.(gltf|glb)$/i, '').replace(/[_-]/g, ' ')
        }))

      return ApiResponse.success({ models: gltfFiles }, 'Models retrieved successfully')
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