import React, { useState } from 'react'
import { Upload, X, FileText, Image } from 'lucide-react'
import { isValidVRFile, isValidImageFile, formatFileSize, ASSET_CATEGORIES } from '../utils/helpers'

const UploadForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    price: ''
  })
  const [vrFile, setVrFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileSelect = (files, type) => {
    const file = files[0]
    if (!file) return

    if (type === 'vr') {
      if (!isValidVRFile(file)) {
        setErrors(prev => ({
          ...prev,
          vrFile: 'Please select a valid VR file (.glb, .gltf, .obj, .fbx)'
        }))
        return
      }
      setVrFile(file)
      setErrors(prev => ({ ...prev, vrFile: '' }))
    } else if (type === 'preview') {
      if (!isValidImageFile(file)) {
        setErrors(prev => ({
          ...prev,
          previewImage: 'Please select a valid image file (JPEG, PNG, WebP)'
        }))
        return
      }
      setPreviewImage(file)
      setErrors(prev => ({ ...prev, previewImage: '' }))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    
    // Determine file type based on extension
    const vrFiles = files.filter(file => isValidVRFile(file))
    const imageFiles = files.filter(file => isValidImageFile(file))
    
    if (vrFiles.length > 0) {
      handleFileSelect(vrFiles, 'vr')
    }
    if (imageFiles.length > 0) {
      handleFileSelect(imageFiles, 'preview')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required'
    }

    if (!vrFile) {
      newErrors.vrFile = 'VR asset file is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const submitData = {
      ...formData,
      tags: tagsArray,
      vrFile,
      previewImage
    }

    onSubmit(submitData)
  }

  const removeFile = (type) => {
    if (type === 'vr') {
      setVrFile(null)
    } else if (type === 'preview') {
      setPreviewImage(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Asset Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter asset name"
              maxLength={100}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe your VR asset"
              maxLength={500}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`input-field ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {ASSET_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (ICP) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.0001"
                min="0"
                className={`input-field ${errors.price ? 'border-red-500' : ''}`}
                placeholder="0.0000"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="input-field"
              placeholder="gaming, environment, sci-fi"
            />
            <p className="text-sm text-gray-500 mt-1">Add relevant tags to help users find your asset</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Files</h3>
        
        {/* VR Asset File */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VR Asset File * (.glb, .gltf, .obj, .fbx)
            </label>
            
            {!vrFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary-400 bg-primary-50' 
                    : errors.vrFile 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-primary-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your VR asset file here, or{' '}
                  <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".glb,.gltf,.obj,.fbx"
                      onChange={(e) => handleFileSelect(e.target.files, 'vr')}
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500">Supports GLB, GLTF, OBJ, FBX files</p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vrFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(vrFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('vr')}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
            )}
            {errors.vrFile && <p className="text-red-500 text-sm mt-1">{errors.vrFile}</p>}
          </div>

          {/* Preview Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview Image (optional)
            </label>
            
            {!previewImage ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-300 transition-colors">
                <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm mb-1">
                  <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
                    Upload preview image
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files, 'preview')}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">JPEG, PNG, WebP (recommended: 512x512px)</p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(previewImage)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{previewImage.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(previewImage.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('preview')}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
            )}
            {errors.previewImage && <p className="text-red-500 text-sm mt-1">{errors.previewImage}</p>}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="loading-spinner w-5 h-5"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            'Upload Asset'
          )}
        </button>
      </div>
    </form>
  )
}

export default UploadForm
