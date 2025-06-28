import React, { useEffect, useRef, useState } from 'react'
import { useCanisterAssetFile } from '../hooks/useCanisterFile'
import { Maximize, Minimize, RotateCcw, Move3D } from 'lucide-react'

const VRViewer = ({ assetUrl, assetName, asset }) => {
  const viewerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vrSupported, setVrSupported] = useState(false)
  
  // Use the hook to get the actual file URL for canister files
  const { objectUrl: fileUrl, loading: fileLoading, error: fileError } = useCanisterAssetFile(asset || { file_url: assetUrl })

  useEffect(() => {
    // Check VR support
    checkVRSupport()
    
    // Initialize A-Frame scene when file URL is available
    if (fileUrl && viewerRef.current && !fileLoading && !fileError) {
      initializeScene()
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

  const initializeScene = () => {
    setLoading(true)
    setError(null)

    // Create A-Frame scene
    const scene = document.createElement('a-scene')
    scene.setAttribute('embedded', true)
    scene.setAttribute('background', 'color: #212121')
    scene.setAttribute('vr-mode-ui', 'enabled: true')
    scene.setAttribute('device-orientation-permission-ui', 'enabled: true')

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
    camera.setAttribute('cursor', 'rayOrigin: mouse')
    cameraRig.appendChild(camera)

    scene.appendChild(cameraRig)

    // Add the 3D model
    const model = document.createElement('a-entity')
    model.setAttribute('id', 'main-model')
    
    // Determine file type and set appropriate component
    const fileExtension = fileUrl.split('.').pop().toLowerCase()
    if (fileExtension === 'glb' || fileExtension === 'gltf') {
      model.setAttribute('gltf-model', fileUrl)
    } else if (fileExtension === 'obj') {
      model.setAttribute('obj-model', `obj: ${fileUrl}`)
    } else {
      // Fallback to gltf-model for other formats
      model.setAttribute('gltf-model', fileUrl)
    }

    model.setAttribute('position', '0 0 0')
    model.setAttribute('rotation', '0 0 0')
    model.setAttribute('scale', '1 1 1')
    model.setAttribute('animation-mixer', '')

    // Add interaction
    model.setAttribute('class', 'interactive')
    model.addEventListener('model-loaded', () => {
      setLoading(false)
      console.log('Model loaded successfully')
    })

    model.addEventListener('model-error', (event) => {
      setError('Failed to load 3D model')
      setLoading(false)
      console.error('Model loading error:', event)
    })

    scene.appendChild(model)

    // Add orbit controls for better interaction
    const orbitControls = document.createElement('a-entity')
    orbitControls.setAttribute('orbit-controls', 'target: #main-model; enableDamping: true; dampingFactor: 0.125; autoRotate: false')
    scene.appendChild(orbitControls)

    // Clear previous content and add new scene
    if (viewerRef.current) {
      viewerRef.current.innerHTML = ''
      viewerRef.current.appendChild(scene)
    }

    // Add resize listener
    const handleResize = () => {
      if (scene.resize) {
        scene.resize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (viewerRef.current.requestFullscreen) {
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
    const model = document.querySelector('#main-model')
    if (model) {
      model.setAttribute('rotation', '0 0 0')
      model.setAttribute('position', '0 0 0')
      model.setAttribute('scale', '1 1 1')
    }

    const cameraRig = document.querySelector('#cameraRig')
    if (cameraRig) {
      cameraRig.setAttribute('position', '0 1.6 3')
      cameraRig.setAttribute('rotation', '0 0 0')
    }
  }

  const enterVR = async () => {
    const scene = document.querySelector('a-scene')
    if (scene && scene.enterVR) {
      try {
        await scene.enterVR()
      } catch (error) {
        console.error('Failed to enter VR:', error)
        alert('Failed to enter VR mode. Please check your VR device connection.')
      }
    }
  }

  // Show loading state while file is being fetched
  if (fileLoading) {
    return (
      <div className="vr-viewer bg-gray-100 flex items-center justify-center">
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
      <div className="vr-viewer bg-gray-100 flex items-center justify-center">
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
      <div className="vr-viewer bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📦</div>
          <p>No asset to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
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
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-lg font-medium mb-2">Failed to load VR asset</p>
              <p className="text-sm opacity-75">{error}</p>
              <button 
                onClick={initializeScene}
                className="mt-4 px-4 py-2 bg-white text-red-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Retry
              </button>
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

            {vrSupported && (
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
      <div className="vr-controls">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Controls:</strong> Mouse/Touch to rotate • WASD to move • Scroll to zoom
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <span>🖱️ Drag to rotate</span>
            <span>⌨️ WASD to move</span>
            <span>🔍 Scroll to zoom</span>
            {vrSupported && <span>🥽 VR Ready</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VRViewer
