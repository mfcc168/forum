'use client'

import React, { useRef, useEffect, useState } from 'react'

interface ModelViewerProps {
  modelPath: string
  className?: string
}

export function ModelViewer({ modelPath, className = '' }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    let animationId: number | null = null
    let mixer: any = null
    let clock: any = null

    const initThreeJS = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const THREE = await import('three')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')

        const container = containerRef.current!
        
        // Create scene with transparent background
        const scene = new THREE.Scene()
        scene.background = null // Transparent background
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75, 
          container.clientWidth / container.clientHeight, 
          0.1, 
          1000
        )
        camera.position.set(2, 2, 4)
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(container.clientWidth, container.clientHeight)
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

        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate)
          
          if (mixer) {
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
          (gltf: any) => {
            if (!mounted) return
            
            const model = gltf.scene
            
            // Remove any problematic materials/objects
            model.traverse((child: any) => {
              if (child.isMesh) {
                // Make sure materials are visible
                if (child.material) {
                  child.material.transparent = false
                  child.material.opacity = 1.0
                }
              }
            })
            
            scene.add(model)
            
            // Center and scale the model properly
            const box = new THREE.Box3().setFromObject(model)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            
            // Use different scales based on context - smaller for list cards, larger for detail page
            const isInCard = container.clientHeight < 500 // Detect if this is in a card (smaller height)
            const fixedScale = isInCard ? 40 : 50 // 20% smaller for cards (40 vs 50)
            
            
            model.scale.setScalar(fixedScale)
            
            // Center the model properly
            const scaledCenter = center.clone().multiplyScalar(fixedScale)
            model.position.sub(scaledCenter)
            
            // Position model lower in the frame so we can see the full model
            model.position.set(0, -50, 0) // Move model down by 50 units
            
            // Rotate model to face front (camera)
            model.rotation.y = Math.PI // 180 degrees rotation to face front
            
            // Use fixed close camera position
            const cameraDistance = 100 // Fixed distance
            
            
            // Position camera to look at the lowered model
            camera.position.set(50, 10, cameraDistance) // Lower camera Y position
            camera.lookAt(0, -50, 0) // Look at where the model is positioned
            
            // Set up animations (always play "idle" if available)
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model)
              
              // Look for idle animation or play the first available
              const idleAnim = gltf.animations.find((anim: any) => 
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
          (progress: any) => {
            // Loading progress - could show percentage if needed
          },
          (error: any) => {
            console.error('Error loading GLTF model:', error)
            setError('Failed to load 3D model')
            setIsLoading(false)
          }
        )

        // Handle window resize
        const handleResize = () => {
          if (!container) return
          
          camera.aspect = container.clientWidth / container.clientHeight
          camera.updateProjectionMatrix()
          renderer.setSize(container.clientWidth, container.clientHeight)
        }
        
        window.addEventListener('resize', handleResize)
        
        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize)
          if (animationId) {
            cancelAnimationFrame(animationId)
          }
          if (renderer) {
            container.removeChild(renderer.domElement)
            renderer.dispose()
          }
          if (mixer) {
            mixer.stopAllAction()
          }
          scene.clear()
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
  }, [modelPath, mounted])

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
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
    </div>
  )
}