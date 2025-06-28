import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import canisterService from '../services/canisterService'
import VRViewer from '../components/VRViewer'
import { formatICP, formatDate, formatFileSize } from '../utils/helpers'
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Download, 
  ExternalLink,
  User,
  Calendar,
  HardDrive,
  Tag,
  ShoppingCart
} from 'lucide-react'

const VRViewerPage = () => {
  const { assetId } = useParams()
  const { identity, principal } = useAuth()
  const navigate = useNavigate()
  const [asset, setAsset] = useState(null)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (identity && assetId) {
      loadAssetData()
    }
  }, [identity, assetId])

  const loadAssetData = async () => {
    try {
      setLoading(true)
      await canisterService.initializeAgent(identity)
      
      // Load asset data
      const assetResult = await canisterService.getAsset(BigInt(assetId))
      
      if (assetResult && assetResult[0]) {
        setAsset(assetResult[0])
        
        // Try to find associated listing
        try {
          const allListings = await canisterService.getMarketplaceListings()
          const assetListing = allListings.find(l => 
            l.asset_id === assetResult[0].id && l.is_active
          )
          if (assetListing) {
            setListing(assetListing)
          }
        } catch (listingError) {
          console.log('No listing found for this asset')
        }
      } else {
        setError('Asset not found')
      }
    } catch (error) {
      console.error('Error loading asset:', error)
      setError('Failed to load asset')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!listing || !asset) return

    try {
      const result = await canisterService.buyAsset(listing.id)
      
      if ('Ok' in result) {
        alert('Asset purchased successfully!')
        navigate('/assets')
      } else {
        alert(`Failed to purchase asset: ${result.Err}`)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to purchase asset. Please try again.')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.share({
        title: asset?.name || 'VR Asset',
        text: asset?.description || 'Check out this VR asset',
        url: url
      })
    } catch (error) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Failed to share:', error)
      }
    }
  }

  const toggleLike = () => {
    setIsLiked(!isLiked)
    // In a real app, you would persist this to the backend
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 animate-pulse rounded-lg"></div>
          <div className="h-8 w-48 bg-gray-300 animate-pulse rounded"></div>
        </div>

        {/* Viewer Skeleton */}
        <div className="h-96 bg-gray-300 animate-pulse rounded-xl"></div>

        {/* Info Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-gray-300 animate-pulse rounded"></div>
            <div className="h-4 bg-gray-300 animate-pulse rounded w-3/4"></div>
            <div className="h-16 bg-gray-300 animate-pulse rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-300 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h2>
        <p className="text-gray-600 mb-6">{error || 'The requested VR asset could not be found.'}</p>
        <div className="space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Go Back
          </button>
          <Link to="/marketplace" className="btn-primary">
            Browse Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = asset.owner.toString() === principal?.toString()
  const canPurchase = listing && !isOwner

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-600">{asset.category}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLike}
            className={`p-2 rounded-lg transition-colors ${
              isLiked 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* VR Viewer */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <VRViewer 
          assetUrl={asset.file_url}
          assetName={asset.name}
          asset={asset}
        />
      </div>

      {/* Asset Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">{asset.description}</p>
          </div>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700"
                  >
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <HardDrive className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-medium">{formatFileSize(Number(asset.file_size))}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ExternalLink className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">File Type</p>
                  <p className="font-medium uppercase">{asset.file_type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(asset.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Asset ID</p>
                  <p className="font-medium">#{asset.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Purchase */}
          <div className="card">
            {canPurchase ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatICP(listing.price)} ICP
                  </div>
                  <p className="text-gray-600">Listed for sale</p>
                </div>
                <button
                  onClick={handlePurchase}
                  className="btn-accent w-full flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={20} />
                  <span>Purchase Asset</span>
                </button>
              </>
            ) : isOwner ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatICP(asset.price)} ICP
                </div>
                <p className="text-gray-600 mb-4">Your asset</p>
                <Link
                  to="/assets"
                  className="btn-primary w-full"
                >
                  Manage Asset
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatICP(asset.price)} ICP
                </div>
                <p className="text-gray-600">Not for sale</p>
              </div>
            )}
          </div>

          {/* Owner Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Owner</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {isOwner ? 'You' : 'Anonymous Creator'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {asset.owner.toString().slice(0, 20)}...
                </p>
              </div>
            </div>
          </div>

          {/* Asset Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{formatDate(asset.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">{formatDate(asset.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${
                  asset.is_for_sale ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {asset.is_for_sale ? 'For Sale' : 'Not Listed'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Download size={16} />
                <span>Download Info</span>
              </button>
              <button 
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Share2 size={16} />
                <span>Share Asset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VRViewerPage
