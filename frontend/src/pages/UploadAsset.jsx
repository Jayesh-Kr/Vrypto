import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import canisterService from '../services/canisterService'
import UploadForm from '../components/UploadForm'
import { generateFileHash, icpToE8s, formatICP, fileToBytes, testFileConversion, getVRFileMimeType } from '../utils/helpers'
import { CheckCircle, AlertCircle } from 'lucide-react'

const UploadAsset = () => {
  const { identity } = useAuth()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('form') // 'form', 'uploading', 'success', 'error'
  const [uploadedAsset, setUploadedAsset] = useState(null)
  const [error, setError] = useState('')

  const handleUpload = async (formData) => {
    try {
      setUploading(true)
      setUploadStep('uploading')
      setError('')

      console.log(identity)
      await canisterService.initializeAgent(identity)
      console.log("Initialized agent");

      // Step 1: Generate file hash
      setUploadStep('uploading')
      const fileHash = await generateFileHash(formData.vrFile)

      // ✅ NEW: Test file conversion integrity before upload
      console.log('🧪 Testing file conversion integrity...')
      const conversionTest = await testFileConversion(formData.vrFile)
      if (!conversionTest.success) {
        throw new Error(`File conversion failed: ${conversionTest.error || 'Unknown error'}`)
      }
      console.log('✅ File conversion test passed')

      // Step 2: Convert file to bytes for canister upload
      const fileBytes = await fileToBytes(formData.vrFile)
      console.log("File converted to bytes i.e. filetoBytes", {
        originalSize: formData.vrFile.size,
        bytesLength: fileBytes.length,
        fileType: formData.vrFile.type,
        fileName: formData.vrFile.name
      });
      
      // Step 3: Handle preview image if present
      let previewImageUrl = null
      console.log("Formdata = ")
      console.log(formData)
      if (formData.previewImage) {
        console.log("Just below formdata.previewImage")
        // For preview images, we can still use object URLs or upload them too
        // For now, let's upload the preview image as well if it's small enough
        try {
          const previewHash = await generateFileHash(formData.previewImage)
          console.log("PreviewHash done")
          const previewBytes = await fileToBytes(formData.previewImage)
          console.log("Preview Bytes Done");
          // Upload preview image (only if less than 1MB)
          if (previewBytes.length < 1024 * 1024) {
            console.log("Reached the uploading section")
            const previewResult = await canisterService.uploadFile(previewHash, previewBytes)
            console.log("Just after previewResult")
            if ('Ok' in previewResult) {
              console.log("inside ok previewresult")
              previewImageUrl = `canister://${previewHash}`
            }
          } else {
            // Fallback to object URL for large preview images
            previewImageUrl = URL.createObjectURL(formData.previewImage)
          }
        } catch (previewError) {
          console.warn('Preview image upload failed, using object URL:', previewError)
          previewImageUrl = URL.createObjectURL(formData.previewImage)
        }
      }

      // Step 4: Create asset record and upload file to canister
      const correctMimeType = getVRFileMimeType(formData.vrFile.name, formData.vrFile.type)
      const assetInput = {
        name: formData.name,
        description: formData.description,
        file_hash: fileHash,
        file_url: `canister://${fileHash}`, // This will be the canister storage URL
        file_type: correctMimeType, // ✅ FIXED: Use proper MIME type instead of just extension
        file_size: BigInt(formData.vrFile.size),
        price: BigInt(icpToE8s(formData.price)),
        category: formData.category,
        tags: formData.tags,
        preview_image_url: previewImageUrl ? [previewImageUrl] : [],
      }
      console.log("📦 Asset Input:", assetInput)
      console.log("📊 File bytes length:", fileBytes.length)
      console.log("🚀 Uploading to canister...")
      
      const result = await canisterService.uploadAssetWithFile(assetInput, fileBytes)
      console.log("📥 Upload result:", result)

      if ('Ok' in result) {
        setUploadedAsset(result.Ok)
        setUploadStep('success')
        console.log("Ok in result");
        // Auto-navigate to assets page after 3 seconds
        setTimeout(() => {
          navigate('/assets')
        }, 3000)
      } else {
        throw new Error(result.Err || 'Failed to upload asset')
      }

    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to upload asset')
      setUploadStep('error')
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadStep('form')
    setUploadedAsset(null)
    setError('')
  }

  if (uploadStep === 'uploading') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="loading-spinner w-8 h-8 border-primary-600 border-opacity-25 border-t-primary-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Uploading Asset</h2>
            <p className="text-gray-600">
              Please wait while we process your VR asset...
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
              <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
              <span>Generating file hash</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
              <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
              <span>Converting file to bytes</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
              <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
              <span>Uploading to canister storage</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
              <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              <span>Creating asset record</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please don't close this page while uploading
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (uploadStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
            <p className="text-gray-600">
              Your VR asset has been successfully uploaded to the marketplace.
            </p>
          </div>

          {uploadedAsset && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {uploadedAsset.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {uploadedAsset.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 text-gray-900">{uploadedAsset.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Price:</span>
                  <span className="ml-2 text-gray-900">
                    {formatICP(uploadedAsset.price)} ICP
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">File Type:</span>
                  <span className="ml-2 text-gray-900 uppercase">
                    {uploadedAsset.file_type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Asset ID:</span>
                  <span className="ml-2 text-gray-900">#{uploadedAsset.id}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/assets')}
              className="btn-primary w-full"
            >
              View My Assets
            </button>
            <button
              onClick={resetUpload}
              className="btn-secondary w-full"
            >
              Upload Another Asset
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 You can now list this asset for sale in the marketplace
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (uploadStep === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an error uploading your VR asset.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={resetUpload}
              className="btn-primary w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary w-full"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm">
              💡 Make sure your file is a valid VR format (GLB, GLTF, OBJ, FBX) and try again
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload VR Asset</h1>
        <p className="text-gray-600">
          Share your VR creation with the world. Upload your 3D models and set your price.
        </p>
      </div>

      <UploadForm onSubmit={handleUpload} loading={uploading} />

      {/* Upload Guidelines */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Use high-quality 3D models for better user experience</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Optimize file sizes for faster loading</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Include detailed descriptions and relevant tags</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Add a preview image to attract buyers</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Supported Formats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">.GLB</span>
              <span className="text-sm text-green-600">Recommended</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">.GLTF</span>
              <span className="text-sm text-green-600">Recommended</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">.OBJ</span>
              <span className="text-sm text-gray-600">Supported</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">.FBX</span>
              <span className="text-sm text-gray-600">Supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadAsset
