'use client'

import dynamic from 'next/dynamic'

// Lazy load the 3D model viewer to avoid SSR issues
const ModelViewer = dynamic(() => import('@/app/components/dex/ModelViewer').then(mod => ({ default: mod.ModelViewer })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-slate-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
        <p className="text-slate-600 text-sm">Loading 3D Preview...</p>
      </div>
    </div>
  )
})

interface DexPreviewSidebarProps {
  modelPath: string
  currentModelScale: number
  currentCameraPosition: { x: number; y: number; z: number }
  currentCameraLookAt: { x: number; y: number; z: number }
  onFieldChange: (fieldName: string, value: unknown) => void
}

export function DexPreviewSidebar({
  modelPath,
  currentModelScale,
  currentCameraPosition,
  currentCameraLookAt,
  onFieldChange
}: DexPreviewSidebarProps) {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-8">
        <div className="relative">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">3D Preview</h3>
          
          {!modelPath ? (
            <div className="w-full h-96 flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg">
              <div className="text-center">
                <div className="text-slate-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm">Please select a 3D model first</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-96 lg:h-[600px] bg-gradient-to-br from-white to-slate-100 rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
              <ModelViewer
                key={`${modelPath}-${currentModelScale}-${JSON.stringify(currentCameraPosition)}-${JSON.stringify(currentCameraLookAt)}`}
                modelPath={modelPath}
                modelScale={currentModelScale}
                cameraPosition={currentCameraPosition}
                cameraLookAt={currentCameraLookAt}
                className="w-full h-full"
              />
            </div>
          )}
          
          {/* Manual Controls */}
          {modelPath && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Adjustments</h4>
              
              {/* Scale */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Scale: {currentModelScale.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="3.0"
                  step="0.01"
                  value={currentModelScale}
                  onChange={(e) => onFieldChange('modelScale', Number(e.target.value))}
                  className="w-full slider"
                />
              </div>
              
              {/* Reset */}
              <button
                type="button"
                onClick={() => {
                  onFieldChange('modelScale', 1.0)
                  onFieldChange('camera.position.x', 2)
                  onFieldChange('camera.position.y', 2)
                  onFieldChange('camera.position.z', 4)
                  onFieldChange('camera.lookAt.x', 0)
                  onFieldChange('camera.lookAt.y', 0)
                  onFieldChange('camera.lookAt.z', 0)
                }}
                className="w-full px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                Reset
              </button>
            </div>
          )}
          
          {/* CSS for slider */}
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              cursor: pointer;
            }
            .slider::-webkit-slider-thumb:hover {
              background: #059669;
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              cursor: pointer;
              border: none;
            }
            .slider::-moz-range-thumb:hover {
              background: #059669;
            }
          `}</style>
          </div>
          {/* Decorative Glow like detail page */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10"></div>
        </div>
      </div>
    </div>
  )
}