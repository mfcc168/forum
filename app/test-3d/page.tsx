'use client'

import { ModelViewer } from '@/app/components/dex/ModelViewer'

export default function Test3DPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">3D Model Test</h1>
      
      <div className="space-y-8">
        {/* Test Wendigo model */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Wendigo Model (Direct ModelViewer)</h2>
          <div className="w-full h-96 border border-gray-300 bg-slate-100">
            <ModelViewer
              modelPath="/models/Wendigo.gltf"
              modelScale={50}
              cameraPosition={{ x: 2, y: 2, z: 4 }}
              cameraLookAt={{ x: 0, y: 0, z: 0 }}
              editMode={false}
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Test Azazel model */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Azazel Model</h2>
          <div className="w-full h-96 border border-gray-300">
            <ModelViewer
              modelPath="/models/Azazel.gltf"
              modelScale={50}
              cameraPosition={{ x: 2, y: 2, z: 4 }}
              cameraLookAt={{ x: 0, y: 0, z: 0 }}
              editMode={false}
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Test with edit mode */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Interactive Editor Test</h2>
          <div className="w-full h-96 border border-gray-300">
            <ModelViewer
              modelPath="/models/Wendigo.gltf"
              modelScale={50}
              cameraPosition={{ x: 2, y: 2, z: 4 }}
              cameraLookAt={{ x: 0, y: 0, z: 0 }}
              editMode={true}
              onValuesChange={(values) => {
                console.log('3D Editor Values Changed:', values)
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}