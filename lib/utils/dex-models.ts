/**
 * Server-side utilities for dex models
 */

import { readdir } from 'fs/promises'
import { join } from 'path'

export interface DexModelOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Fetch available GLTF model files from the server filesystem
 * This replaces the client-side API call to ensure SSR consistency
 */
export async function getDexModelsServerSide(): Promise<DexModelOption[]> {
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

    return modelOptions
  } catch (error) {
    console.error('Error reading models directory:', error)
    // Return empty array instead of throwing to prevent page crash
    return []
  }
}