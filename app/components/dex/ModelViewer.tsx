'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import type * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface ModelViewerProps {
  modelPath: string
  className?: string
  modelScale?: number
  cameraPosition?: { x: number; y: number; z: number }
  cameraLookAt?: { x: number; y: number; z: number }
  editMode?: boolean
  onValuesChange?: (values: {
    modelScale: number
    cameraPosition: { x: number; y: number; z: number }
    cameraLookAt: { x: number; y: number; z: number }
  }) => void
}

export function ModelViewer({ 
  modelPath, 
  className = '', 
  modelScale = 1.0,
  cameraPosition = { x: 2, y: 2, z: 4 },
  cameraLookAt = { x: 0, y: 0, z: 0 },
  editMode = false,
  onValuesChange
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Interactive editing state
  const [currentScale, setCurrentScale] = useState(modelScale)
  const [currentCameraPos, setCurrentCameraPos] = useState(cameraPosition)
  const [currentCameraLookAt, setCurrentCameraLookAt] = useState(cameraLookAt)
  
  // Track if we're updating from user interaction to prevent prop sync loops
  const isUserInteracting = useRef(false)
  
  // Refs for Three.js objects (needed for interactive editing)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Only sync props to internal state when not during user interaction
  useEffect(() => {
    if (!isUserInteracting.current) {
      setCurrentScale(modelScale)
      setCurrentCameraPos(cameraPosition)
      setCurrentCameraLookAt(cameraLookAt)
    }
  }, [modelScale, cameraPosition, cameraLookAt])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    let animationId: number | null = null
    let mixer: THREE.AnimationMixer | null = null
    let clock: THREE.Clock | null = null

    const initThreeJS = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const THREE = await import('three')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')

        const container = containerRef.current
        if (!container) return
        
        // Create scene with transparent background
        const scene = new THREE.Scene()
        scene.background = null // Transparent background
        sceneRef.current = scene
        
        // Create camera with safe container dimensions
        const containerWidth = container.clientWidth || 300
        const containerHeight = container.clientHeight || 300
        const camera = new THREE.PerspectiveCamera(
          75, 
          containerWidth / containerHeight, 
          0.1, 
          1000
        )
        camera.position.set(currentCameraPos.x, currentCameraPos.y, currentCameraPos.z)
        cameraRef.current = camera
        
        // Create renderer with safe dimensions
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(containerWidth, containerHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(1, 1, 1)
        directionalLight.castShadow = true
        scene.add(directionalLight)
        
        // Clock for animations
        clock = new THREE.Clock()
        
        // Append renderer to container
        container.appendChild(renderer.domElement)
        
        // Add orbit controls for mouse interaction
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.autoRotate = false
        controlsRef.current = controls
        
        // In edit mode, enable more controls and add event listeners
        if (editMode) {
          controls.enableZoom = true
          controls.enableRotate = true
          controls.enablePan = true
          
          // Listen to camera changes and update state with throttling
          let updateTimeout: NodeJS.Timeout | null = null
          
          // Track when user starts interacting with camera
          const handleInteractionStart = () => {
            isUserInteracting.current = true
          }
          
          const handleInteractionEnd = () => {
            setTimeout(() => {
              isUserInteracting.current = false
            }, 500) // Keep interaction flag for a bit after user stops
          }
          
          // Add interaction tracking
          controls.addEventListener('start', handleInteractionStart)
          controls.addEventListener('end', handleInteractionEnd)
          
          controls.addEventListener('change', () => {
            if (updateTimeout === null) {
              updateTimeout = setTimeout(() => {
                const newCameraPos = {
                  x: Math.round(camera.position.x * 100) / 100,
                  y: Math.round(camera.position.y * 100) / 100,
                  z: Math.round(camera.position.z * 100) / 100
                }
                const newLookAt = {
                  x: Math.round(controls.target.x * 100) / 100,
                  y: Math.round(controls.target.y * 100) / 100,
                  z: Math.round(controls.target.z * 100) / 100
                }
                setCurrentCameraPos(newCameraPos)
                setCurrentCameraLookAt(newLookAt)
                
                // Update parent form after state update
                setTimeout(() => {
                  if (editMode && onValuesChange) {
                    onValuesChange({
                      modelScale: currentScale,
                      cameraPosition: newCameraPos,
                      cameraLookAt: newLookAt
                    })
                  }
                }, 0)
                
                updateTimeout = null
              }, 100) // Throttle updates to every 100ms
            }
          })
        }

        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate)
          
          if (mixer && clock) {
            mixer.update(clock.getDelta())
          }
          
          // Update controls
          controls.update()
          
          renderer.render(scene, camera)
        }
        
        // Load GLTF model
        const loader = new GLTFLoader()
        loader.load(
          modelPath,
          (gltf) => {
            if (!mounted) return
            
            const model = gltf.scene
            
            // Remove any problematic materials/objects
            model.traverse((child: THREE.Object3D) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                // Make sure materials are visible
                if (mesh.material) {
                  const material = mesh.material as THREE.MeshStandardMaterial
                  material.transparent = false
                  material.opacity = 1.0
                }
              }
            })
            
            scene.add(model)
            modelRef.current = model
            
            // Calculate model dimensions for centering
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            
            // Use current scale (which can be changed interactively)
            model.scale.setScalar(currentScale)
            
            // Center the model properly
            model.position.sub(center)
            
            // Set initial camera position and look-at target
            camera.position.set(currentCameraPos.x, currentCameraPos.y, currentCameraPos.z)
            camera.lookAt(currentCameraLookAt.x, currentCameraLookAt.y, currentCameraLookAt.z)
            controls.target.set(currentCameraLookAt.x, currentCameraLookAt.y, currentCameraLookAt.z)
            controls.update()
            
            // Simple model positioning
            model.position.y = -size.y * 0.1 // Slightly lower so we can see the full model
            
            // Rotate model to face front (camera)
            model.rotation.y = Math.PI // 180 degrees rotation to face front
            
            // Set up animations (always play "idle" if available)
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model)
              
              // Look for idle animation or play the first available
              const idleAnim = gltf.animations.find((anim) => 
                anim.name.toLowerCase().includes('idle')
              ) || gltf.animations[0]
              
              if (idleAnim) {
                const action = mixer.clipAction(idleAnim)
                action.play()
              }
            }
            
            setIsLoading(false)
            animate()
          },
          () => {
            // Loading progress - could show percentage if needed
          },
          (error: unknown) => {
            console.error('Error loading GLTF model:', error, 'Path:', modelPath)
            setError('Failed to load 3D model')
            setIsLoading(false)
          }
        )

        // Handle window resize with safety checks
        const handleResize = () => {
          const currentContainer = containerRef.current
          if (!currentContainer || !camera || !renderer) return
          
          const width = currentContainer.clientWidth || 300
          const height = currentContainer.clientHeight || 300
          
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
        }
        
        window.addEventListener('resize', handleResize)
        
        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize)
          if (animationId) {
            cancelAnimationFrame(animationId)
          }
          if (renderer && renderer.domElement) {
            // Check if container still exists before trying to remove child
            const currentContainer = containerRef.current
            if (currentContainer && currentContainer.contains(renderer.domElement)) {
              currentContainer.removeChild(renderer.domElement)
            }
            renderer.dispose()
          }
          if (mixer) {
            mixer.stopAllAction()
          }
          if (scene) {
            scene.clear()
          }
        }

      } catch (error) {
        console.error('Error initializing 3D viewer:', error)
        setError('Failed to initialize 3D viewer')
        setIsLoading(false)
      }
    }

    // Start initialization
    const cleanupPromise = initThreeJS()

    // Return cleanup function
    return () => {
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup()
      })
    }
  }, [modelPath, mounted]) // Only reinitialize when model path or mount state changes

  // Update parent form only when values actually change from user interaction
  const updateParentForm = useCallback(() => {
    if (editMode && onValuesChange && isUserInteracting.current) {
      onValuesChange({
        modelScale: currentScale,
        cameraPosition: currentCameraPos,
        cameraLookAt: currentCameraLookAt
      })
    }
  }, [editMode, onValuesChange, currentScale, currentCameraPos, currentCameraLookAt])

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // Handlers for visual controls
  const handleScaleChange = (newScale: number) => {
    isUserInteracting.current = true
    setCurrentScale(newScale)
    if (modelRef.current) {
      modelRef.current.scale.setScalar(newScale)
    }
    // Update parent form immediately
    setTimeout(() => {
      updateParentForm()
      isUserInteracting.current = false
    }, 50)
  }

  const handleResetValues = () => {
    isUserInteracting.current = true
    const defaultScale = 1.0
    const defaultCameraPos = { x: 2, y: 2, z: 4 }
    const defaultCameraLookAt = { x: 0, y: 0, z: 0 }
    
    setCurrentScale(defaultScale)
    setCurrentCameraPos(defaultCameraPos)
    setCurrentCameraLookAt(defaultCameraLookAt)
    
    if (modelRef.current) {
      modelRef.current.scale.setScalar(defaultScale)
    }
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(defaultCameraPos.x, defaultCameraPos.y, defaultCameraPos.z)
      controlsRef.current.target.set(defaultCameraLookAt.x, defaultCameraLookAt.y, defaultCameraLookAt.z)
      controlsRef.current.update()
    }
    // Update parent form immediately
    setTimeout(() => {
      updateParentForm()
      isUserInteracting.current = false
    }, 50)
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
            <p className="text-slate-600 text-sm">Loading 3D model...</p>
          </div>
        </div>
      )}
      
      {/* Visual Controls Overlay (only in edit mode) */}
      {editMode && !isLoading && (
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-4 min-w-64">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">3D Editor</h3>
              <button
                onClick={handleResetValues}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
              >
                Reset
              </button>
            </div>
            
            {/* Scale Control */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Model Scale: {currentScale.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="3.0"
                step="0.01"
                value={currentScale}
                onChange={(e) => handleScaleChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Tiny (0.01)</span>
                <span>Large (3.0)</span>
              </div>
            </div>
            
            {/* Camera Position Display */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Camera Position</label>
              <div className="bg-slate-50 rounded px-2 py-1 text-xs font-mono text-slate-600">
                X: {currentCameraPos.x}, Y: {currentCameraPos.y}, Z: {currentCameraPos.z}
              </div>
            </div>
            
            {/* Camera Look At Display */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Look At</label>
              <div className="bg-slate-50 rounded px-2 py-1 text-xs font-mono text-slate-600">
                X: {currentCameraLookAt.x}, Y: {currentCameraLookAt.y}, Z: {currentCameraLookAt.z}
              </div>
            </div>
            
            {/* Instructions */}
            <div className="text-xs text-slate-500 border-t border-slate-200 pt-3">
              <p className="mb-1">🖱️ Drag to rotate camera</p>
              <p className="mb-1">⚲ Scroll to zoom in/out</p>
              <p>🎛️ Adjust scale with slider</p>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      
      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}