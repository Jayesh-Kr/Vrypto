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
          const blob = new Blob([uint8Array])
          currentObjectUrl = URL.createObjectURL(blob)
          setObjectUrl(currentObjectUrl)
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
  return useCanisterFile(asset?.file_url)
}

export const useCanisterPreviewImage = (asset) => {
  const previewUrl = asset?.preview_image_url && asset.preview_image_url.length > 0 
    ? asset.preview_image_url[0] 
    : null
  return useCanisterFile(previewUrl)
}
