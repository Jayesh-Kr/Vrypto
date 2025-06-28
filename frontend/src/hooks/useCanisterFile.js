import { useState, useEffect } from 'react'
import canisterService from '../services/canisterService'

export const useCanisterFile = (fileUrl) => {
  const [objectUrl, setObjectUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    let currentObjectUrl = null

    const loadFile = async () => {
      if (!fileUrl) {
        setObjectUrl(null)
        setLoading(false)
        return
      }

      // If it's not a canister URL, use it directly
      if (!fileUrl.startsWith('canister://')) {
        setObjectUrl(fileUrl)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const fileHash = fileUrl.replace('canister://', '')
        const fileBytes = await canisterService.getFile(fileHash)
        
        if (!isMounted) return

        if (fileBytes && fileBytes.length > 0) {
          // Convert bytes to blob and create object URL
          const uint8Array = new Uint8Array(fileBytes)
          
          // ✅ FIXED: Determine correct MIME type based on file hash/extension
          let mimeType = 'application/octet-stream' // Default
          
          // Try to infer MIME type from file hash (if it contains extension info)
          // or use a more specific type for GLB files
          if (fileHash.includes('.glb') || fileHash.endsWith('glb')) {
            mimeType = 'model/gltf-binary'
          } else if (fileHash.includes('.gltf') || fileHash.endsWith('gltf')) {
            mimeType = 'model/gltf+json'
          } else if (fileHash.includes('.obj') || fileHash.endsWith('obj')) {
            mimeType = 'text/plain' // OBJ files are text-based
          }
          
          console.log('Creating blob with MIME type:', mimeType, 'for file:', fileHash)
          console.log('File bytes length:', uint8Array.length)
          
          const blob = new Blob([uint8Array], { type: mimeType })
          currentObjectUrl = URL.createObjectURL(blob)
          setObjectUrl(currentObjectUrl)
          
          // ✅ DEBUG: Log blob details for verification
          console.log('Created blob:', {
            size: blob.size,
            type: blob.type,
            originalBytesLength: fileBytes.length,
            uint8ArrayLength: uint8Array.length
          })
        } else {
          setError('File not found')
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFile()

    // Cleanup function
    return () => {
      isMounted = false
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [fileUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  return { objectUrl, loading, error }
}

export const useCanisterAssetFile = (asset) => {
  const [objectUrl, setObjectUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    let currentObjectUrl = null

    const loadFile = async () => {
      if (!asset?.file_url) {
        setObjectUrl(null)
        setLoading(false)
        return
      }

      // If it's not a canister URL, use it directly
      if (!asset.file_url.startsWith('canister://')) {
        setObjectUrl(asset.file_url)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const fileHash = asset.file_url.replace('canister://', '')
        const fileBytes = await canisterService.getFile(fileHash)
        
        if (!isMounted) return

        if (fileBytes && fileBytes.length > 0) {
          // Convert bytes to blob and create object URL
          const uint8Array = new Uint8Array(fileBytes)
          
          // ✅ ENHANCED: Use asset metadata to determine correct MIME type
          let mimeType = 'application/octet-stream' // Default
          
          if (asset.file_type) {
            // Use the stored file type from asset metadata
            mimeType = asset.file_type
          } else {
            // Fallback: infer from file extension or hash
            const fileName = asset.name?.toLowerCase() || fileHash.toLowerCase()
            if (fileName.includes('.glb') || fileName.endsWith('glb')) {
              mimeType = 'model/gltf-binary'
            } else if (fileName.includes('.gltf') || fileName.endsWith('gltf')) {
              mimeType = 'model/gltf+json'
            } else if (fileName.includes('.obj') || fileName.endsWith('obj')) {
              mimeType = 'text/plain'
            }
          }
          
          console.log('🔧 Creating asset blob:', {
            assetName: asset.name,
            fileType: asset.file_type,
            determinedMimeType: mimeType,
            fileHash: fileHash,
            bytesLength: uint8Array.length,
            originalFileSize: asset.file_size
          })
          
          const blob = new Blob([uint8Array], { type: mimeType })
          currentObjectUrl = URL.createObjectURL(blob)
          setObjectUrl(currentObjectUrl)
          
          // ✅ INTEGRITY CHECK: Verify blob size matches expected file size
          if (asset.file_size && blob.size !== Number(asset.file_size)) {
            console.warn('⚠️ File size mismatch!', {
              expectedSize: Number(asset.file_size),
              actualBlobSize: blob.size,
              bytesArrayLength: uint8Array.length
            })
          } else {
            console.log('✅ File size verified:', blob.size, 'bytes')
          }
        } else {
          setError('File not found')
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ Error loading asset file:', err)
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFile()

    // Cleanup function
    return () => {
      isMounted = false
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [asset?.file_url, asset?.file_type, asset?.name, asset?.file_size])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  return { objectUrl, loading, error }
}

export const useCanisterPreviewImage = (asset) => {
  const previewUrl = asset?.preview_image_url && asset.preview_image_url.length > 0 
    ? asset.preview_image_url[0] 
    : null
  return useCanisterFile(previewUrl)
}
