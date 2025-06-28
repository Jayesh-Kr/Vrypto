import React from 'react'
import { Link } from 'react-router-dom'
import { formatICP, formatDate, truncateText } from '../utils/helpers'
import { useCanisterPreviewImage } from '../hooks/useCanisterFile'
import { Eye, ShoppingCart, Tag, Calendar } from 'lucide-react'

const AssetCard = ({ asset, showBuyButton = false, showViewButton = true, onBuy }) => {
  const { objectUrl: previewImageUrl, loading: previewLoading } = useCanisterPreviewImage(asset)

  const handleBuy = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onBuy) {
      onBuy(asset)
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300 group">
      {/* Asset Preview */}
      <div className="relative mb-4">
        {previewLoading ? (
          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        ) : previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt={asset.name}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        
        {/* Fallback for no preview image */}
        {!previewLoading && !previewImageUrl && (
          <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">{asset.file_type?.toUpperCase()} Model</p>
            </div>
          </div>
        )}

        {/* Price Badge */}
        {asset.is_for_sale && (
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 text-sm font-semibold text-primary-600">
            {formatICP(asset.price)} ICP
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
          {asset.category}
        </div>
      </div>

      {/* Asset Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
            {truncateText(asset.name, 25)}
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {truncateText(asset.description, 60)}
          </p>
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                <Tag size={10} className="mr-1" />
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{asset.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{formatDate(asset.created_at)}</span>
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
            {asset.file_type?.toUpperCase()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {showViewButton && (
            <Link
              to={`/vr-viewer/${asset.id}`}
              className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Eye size={16} />
              <span>View in VR</span>
            </Link>
          )}

          {showBuyButton && asset.is_for_sale && (
            <button
              onClick={handleBuy}
              className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <ShoppingCart size={16} />
              <span>Buy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssetCard
