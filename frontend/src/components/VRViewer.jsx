import React, { useEffect, useRef, useState } from 'react'
import { useCanisterAssetFile } from '../hooks/useCanisterFile'
import { Maximize, Minimize, RotateCcw, Move3D } from 'lucide-react'

const VRViewer = ({ assetUrl, assetName, asset }) => {
  const viewerRef = useRef(null)
  const sceneRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vrSupported, setVrSupported] = useState(false)
  
  // Use the hook to get the actual file URL for canister files
  const { objectUrl: fileUrl, loading: fileLoading, error: fileError } = useCanisterAssetFile(asset || { file_url: assetUrl })

  useEffect(() => {
    checkVRSupport()
    
    if (fileUrl && viewerRef.current && !fileLoading && !fileError) {
      initializeScene()
    }

    return () => {
      cleanupScene()
    }
  }, [fileUrl, fileLoading, fileError])

  const checkVRSupport = async () => {
    if ('xr' in navigator) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-vr')
        setVrSupported(supported)
      } catch (error) {
        console.log('VR not supported:', error)
        setVrSupported(false)
      }
    }
  }

  const cleanupScene = () => {
    if (sceneRef.current) {
      try {
        const models = sceneRef.current.querySelectorAll('[gltf-model]')
        models.forEach(model => {
          model.removeEventListener('model-loaded', handleModelLoaded)
          model.removeEventListener('model-error', handleModelError)
        })

        if (viewerRef.current) {
          viewerRef.current.innerHTML = ''
        }
        
        sceneRef.current = null
      } catch (error) {
        console.warn('Cleanup error:', error)
      }
    }
  }

  const handleModelLoaded = () => {
    setLoading(false)
    setError(null)
    console.log('✅ Model loaded successfully for:', asset?.name || assetName)
    
    // ✅ NEW: Try to auto-scale the model if it's too large or too small
    setTimeout(() => {
      try {
        const model = sceneRef.current?.querySelector('#main-model')
        if (model && model.object3D) {
          const box = new THREE.Box3().setFromObject(model.object3D)
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          
          // Auto-scale if model is too large (>5 units) or too small (<0.1 units)
          if (maxDim > 5) {
            const scale = 2 / maxDim
            model.setAttribute('scale', `${scale} ${scale} ${scale}`)
            console.log(`📏 Auto-scaled large model by ${scale}`)
          } else if (maxDim < 0.1) {
            const scale = 1 / maxDim
            model.setAttribute('scale', `${scale} ${scale} ${scale}`)
            console.log(`📏 Auto-scaled small model by ${scale}`)
          }
        }
      } catch (error) {
        console.warn('Auto-scaling failed:', error)
      }
    }, 500)
  }

  const handleModelError = (event) => {
    setError('Failed to load 3D model. The file may be corrupted or in an unsupported format.')
    setLoading(false)
    console.error('❌ Model loading error for:', asset?.name || assetName, event)
    
    // ✅ NEW: Provide more specific error information
    if (event.detail) {
      console.error('Error details:', event.detail)
    }
  }

  const initializeScene = () => {
    cleanupScene()
    
    setLoading(true)
    setError(null)

    try {
      // ✅ FIXED: Better file validation
      if (!fileUrl || fileUrl === 'canister://placeholder') {
        setError('Invalid or missing 3D model file')
        setLoading(false)
        return
      }

      // ✅ ENHANCED: Get file type from asset metadata with better detection
      let fileType = 'glb' // Default to GLB
      if (asset?.file_type) {
        // Use the MIME type stored in the asset
        const mimeType = asset.file_type.toLowerCase()
        if (mimeType.includes('gltf-binary') || mimeType.includes('.glb')) {
          fileType = 'glb'
        } else if (mimeType.includes('gltf') || mimeType.includes('.gltf')) {
          fileType = 'gltf'
        } else if (mimeType.includes('obj') || mimeType.includes('.obj')) {
          fileType = 'obj'
        }
      } else {
        // Try to detect from asset name or URL if available
        const fileName = (asset?.name || assetName || '').toLowerCase()
        if (fileName.includes('.glb')) {
          fileType = 'glb'
        } else if (fileName.includes('.gltf')) {
          fileType = 'gltf'
        } else if (fileName.includes('.obj')) {
          fileType = 'obj'
        }
      }

      console.log('🎨 VRViewer loading:', {
        fileType,
        assetFileType: asset?.file_type,
        assetName: asset?.name || assetName,
        fileUrl,
        assetSize: asset?.file_size
      })

      // ✅ FIXED: Validate file type before proceeding
      const supportedTypes = ['glb', 'gltf', 'obj']
      if (!supportedTypes.includes(fileType)) {
        setError(`Unsupported file type: ${fileType}. Supported formats: GLB, GLTF, OBJ`)
        setLoading(false)
        return
      }

      // Create A-Frame scene
      const scene = document.createElement('a-scene')
      scene.setAttribute('embedded', true)
      scene.setAttribute('background', 'color: #212121')
      scene.setAttribute('vr-mode-ui', 'enabled: true')
      scene.setAttribute('device-orientation-permission-ui', 'enabled: true')
      
      // ✅ FIXED: Disable VR for local development to avoid HTTPS warnings
      if (window.location.protocol !== 'https:') {
        scene.setAttribute('vr-mode-ui', 'enabled: false')
      }

      // Add environment
      const environment = document.createElement('a-entity')
      environment.setAttribute('environment', 'preset: forest; groundColor: #445; grid: 1x1')
      scene.appendChild(environment)

      // Add lighting
      const ambientLight = document.createElement('a-light')
      ambientLight.setAttribute('type', 'ambient')
      ambientLight.setAttribute('color', '#404040')
      scene.appendChild(ambientLight)

      const directionalLight = document.createElement('a-light')
      directionalLight.setAttribute('type', 'directional')
      directionalLight.setAttribute('position', '0 1 1')
      directionalLight.setAttribute('light', 'castShadow: true')
      scene.appendChild(directionalLight)

      // Add camera with controls
      const cameraRig = document.createElement('a-entity')
      cameraRig.setAttribute('id', 'cameraRig')
      cameraRig.setAttribute('position', '0 1.6 3')

      const camera = document.createElement('a-camera')
      camera.setAttribute('look-controls', true)
      camera.setAttribute('wasd-controls', true)
      cameraRig.appendChild(camera)

      scene.appendChild(cameraRig)

      // ✅ FIXED: Better model loading with file type detection
      const model = document.createElement('a-entity')
      model.setAttribute('id', 'main-model')
      
      // Set model source based on detected file type
      if (fileType === 'glb' || fileType === 'gltf') {
        model.setAttribute('gltf-model', fileUrl)
      } else if (fileType === 'obj') {
        model.setAttribute('obj-model', `obj: ${fileUrl}`)
      } else {
        // Fallback to GLTF
        console.warn('Unknown file type, attempting to load as GLTF:', fileType)
        model.setAttribute('gltf-model', fileUrl)
      }

      model.setAttribute('position', '0 0 0')
      model.setAttribute('rotation', '0 0 0')
      model.setAttribute('scale', '1 1 1')

      // Add event listeners
      model.addEventListener('model-loaded', handleModelLoaded)
      model.addEventListener('model-error', handleModelError)

      scene.appendChild(model)

      sceneRef.current = scene

      if (viewerRef.current) {
        viewerRef.current.appendChild(scene)
      }

      // ✅ FIXED: Shorter timeout for faster feedback
      setTimeout(() => {
        if (loading) {
          setError('Model loading timed out. The file may be too large or corrupted.')
          setLoading(false)
        }
      }, 10000) // 10 second timeout

    } catch (error) {
      console.error('Scene initialization error:', error)
      setError('Failed to initialize VR scene')
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (viewerRef.current?.requestFullscreen) {
        viewerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const resetView = () => {
    try {
      const model = sceneRef.current?.querySelector('#main-model')
      if (model) {
        model.setAttribute('rotation', '0 0 0')
        model.setAttribute('position', '0 0 0')
        model.setAttribute('scale', '1 1 1')
      }

      const cameraRig = sceneRef.current?.querySelector('#cameraRig')
      if (cameraRig) {
        cameraRig.setAttribute('position', '0 1.6 3')
        cameraRig.setAttribute('rotation', '0 0 0')
      }
    } catch (error) {
      console.warn('Reset view error:', error)
    }
  }

  const enterVR = async () => {
    if (window.location.protocol !== 'https:') {
      alert('VR mode requires HTTPS. Please access this site over HTTPS to enable VR features.')
      return
    }

    try {
      if (sceneRef.current?.enterVR) {
        await sceneRef.current.enterVR()
      }
    } catch (error) {
      console.error('Failed to enter VR:', error)
      alert('Failed to enter VR mode. Please check your VR device connection.')
    }
  }

  // Show loading state while file is being fetched
  if (fileLoading) {
    return (
      <div className="vr-viewer bg-gray-100 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-center text-gray-500">
          <div className="loading-spinner w-8 h-8 mx-auto mb-2"></div>
          <p>Loading VR asset...</p>
        </div>
      </div>
    )
  }

  // Show error if file failed to load
  if (fileError) {
    return (
      <div className="vr-viewer bg-gray-100 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-center text-red-500">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Failed to load VR asset</p>
          <p className="text-sm">{fileError}</p>
        </div>
      </div>
    )
  }

  if (!fileUrl) {
    return (
      <div className="vr-viewer bg-gray-100 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📦</div>
          <p>No asset to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* HTTPS Warning for VR */}
      {window.location.protocol !== 'https:' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> VR mode requires HTTPS. You can still view the 3D model, but VR features are disabled on localhost.
          </p>
        </div>
      )}

      {/* Viewer Container */}
      <div 
        ref={viewerRef} 
        className="vr-viewer bg-gray-900 relative overflow-hidden"
        style={{ 
          height: isFullscreen ? '100vh' : '500px',
          width: '100%'
        }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="loading-spinner mx-auto mb-4 border-white border-opacity-25 border-t-white"></div>
              <p>Loading {assetName}...</p>
              <p className="text-sm opacity-75 mt-2">This may take a moment for large files</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center text-white max-w-md">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-lg font-medium mb-2">Failed to load VR asset</p>
              <p className="text-sm opacity-75 mb-4">{error}</p>
              <div className="space-x-2">
                <button 
                  onClick={initializeScene}
                  className="px-4 py-2 bg-white text-red-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Retry
                </button>
                <button 
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-transparent border border-white text-white rounded-lg hover:bg-white hover:text-red-900 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {!loading && !error && (
          <div className="absolute top-4 right-4 z-20 flex space-x-2">
            <button
              onClick={resetView}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-colors"
              title="Reset View"
            >
              <RotateCcw size={20} />
            </button>

            {vrSupported && window.location.protocol === 'https:' && (
              <button
                onClick={enterVR}
                className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-colors"
                title="Enter VR"
              >
                <Move3D size={20} />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Controls Info */}
      {!loading && !error && (
        <div className="vr-controls mt-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Controls:</strong> Mouse/Touch to rotate • WASD to move • Scroll to zoom
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <span>🖱️ Drag to rotate</span>
              <span>⌨️ WASD to move</span>
              <span>🔍 Scroll to zoom</span>
              {vrSupported && window.location.protocol === 'https:' && <span>🥽 VR Ready</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VRViewer
