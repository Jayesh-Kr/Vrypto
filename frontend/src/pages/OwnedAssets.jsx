import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import canisterService from '../services/canisterService'
import AssetCard from '../components/AssetCard'
import { formatICP, formatDate, getStatusColor, TRANSACTION_STATUS_LABELS, icpToE8s } from '../utils/helpers'
import { 
  Wallet, 
  TrendingUp, 
  Eye, 
  Settings, 
  Plus,
  Tag,
  BarChart3,
  Filter
} from 'lucide-react'

const OwnedAssets = () => {
  const { identity, principal } = useAuth()
  const [assets, setAssets] = useState([])
  const [listings, setListings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assets')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showListingModal, setShowListingModal] = useState(false)
  const [listingPrice, setListingPrice] = useState('')
  const [listingLoading, setListingLoading] = useState(false)

  useEffect(() => {
    if (identity && principal) {
      loadUserData()
    }
  }, [identity, principal])

  const loadUserData = async () => {
    try {
      setLoading(true)
      await canisterService.initializeAgent(identity)
      
      const [assetsResult, listingsResult, transactionsResult] = await Promise.allSettled([
        canisterService.getUserAssets(principal),
        canisterService.getUserListings(principal),
        canisterService.getUserTransactions(principal)
      ])

      if (assetsResult.status === 'fulfilled') {
        setAssets(assetsResult.value || [])
      }

      if (listingsResult.status === 'fulfilled') {
        setListings(listingsResult.value || [])
      }

      if (transactionsResult.status === 'fulfilled') {
        setTransactions(transactionsResult.value || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateListing = async () => {
    if (!selectedAsset || !listingPrice || listingLoading) return

    try {
      setListingLoading(true)

      const listingData = {
        asset_id: selectedAsset.id,
        price: BigInt(icpToE8s(listingPrice)),
        title: selectedAsset.name,
        description: selectedAsset.description,
        category: selectedAsset.category,
        tags: selectedAsset.tags,
      }
      
      console.log("Listing items")
      const result = await canisterService.createListing(listingData)
      console.log("result in ownedAsset = " , result);

      if ('Ok' in result) {
        // Also set the asset for sale
        await canisterService.setAssetForSale(selectedAsset.id, true)
        
        alert('Asset listed successfully!')
        setShowListingModal(false)
        setSelectedAsset(null)
        setListingPrice('')
        
        // Reload data
        await loadUserData()
      } else {
        alert(`Failed to create listing: ${result.Err}`)
      }
    } catch (error) {
      console.error('Listing error:', error)
      alert('Failed to create listing. Please try again.')
    } finally {
      setListingLoading(false)
    }
  }

  const handleCancelListing = async (listing) => {
    if (!listing) return

    try {
      const result = await canisterService.cancelListing(listing.id)
      
      if ('Ok' in result) {
        // Also remove asset from sale
        await canisterService.setAssetForSale(listing.asset_id, false)
        
        alert('Listing cancelled successfully!')
        await loadUserData()
      } else {
        alert(`Failed to cancel listing: ${result.Err}`)
      }
    } catch (error) {
      console.error('Cancel listing error:', error)
      alert('Failed to cancel listing. Please try again.')
    }
  }

  const openListingModal = (asset) => {
    setSelectedAsset(asset)
    setListingPrice(formatICP(asset.price))
    setShowListingModal(true)
  }

  const totalValue = assets.reduce((total, asset) => total + Number(asset.price), 0)
  const assetsForSale = assets.filter(asset => asset.is_for_sale).length
  const completedSales = transactions.filter(tx => 
    tx.seller.toString() === principal.toString() && 
    tx.status && 'Completed' in tx.status
  ).length

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-6 bg-gray-300 animate-pulse rounded mb-2"></div>
              <div className="h-8 bg-gray-300 animate-pulse rounded"></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="asset-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-48 bg-gray-300 animate-pulse rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 animate-pulse rounded"></div>
                <div className="h-4 bg-gray-300 animate-pulse rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My VR Assets</h1>
          <p className="text-gray-600 mt-1">
            Manage your VR asset collection and marketplace listings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wallet className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Assets</div>
              <div className="text-2xl font-bold text-gray-900">{assets.length}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Portfolio Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatICP(totalValue)} ICP
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Tag className="h-8 w-8 text-accent-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Listed for Sale</div>
              <div className="text-2xl font-bold text-gray-900">{assetsForSale}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assets'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Listings ({listings.filter(l => l.is_active).length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'assets' && (
        <div>
          {assets.length > 0 ? (
            <div className="asset-grid">
              {assets.map((asset) => (
                <div key={asset.id} className="relative group">
                  <AssetCard asset={asset} showBuyButton={false} />
                  
                  {/* Asset Actions */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      {!asset.is_for_sale ? (
                        <button
                          onClick={() => openListingModal(asset)}
                          className="p-2 bg-white bg-opacity-90 backdrop-blur-sm text-primary-600 hover:bg-primary-50 rounded-full shadow-sm"
                          title="List for Sale"
                        >
                          <Tag size={16} />
                        </button>
                      ) : (
                        <div className="p-2 bg-green-500 bg-opacity-90 backdrop-blur-sm text-white rounded-full shadow-sm">
                          <Tag size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Plus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No assets yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your VR asset collection by uploading your first creation
              </p>
              <Link to="/upload" className="btn-primary">
                Upload Asset
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          {listings.filter(l => l.is_active).length > 0 ? (
            <div className="space-y-4">
              {listings.filter(l => l.is_active).map((listing) => {
                const asset = assets.find(a => a.id === listing.asset_id)
                return (
                  <div key={listing.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🎯</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {listing.title}
                          </h3>
                          <p className="text-gray-600 text-sm">{listing.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Listed {formatDate(listing.created_at)}</span>
                            <span className="text-primary-600 font-medium">
                              {formatICP(listing.price)} ICP
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCancelListing(listing)}
                          className="btn-secondary"
                        >
                          Cancel Listing
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Tag className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No active listings</h3>
              <p className="text-gray-600 mb-6">
                List your assets for sale to start earning ICP
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transaction.buyer.toString() === principal.toString() ? 'Purchase' : 'Sale'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Asset ID: #{transaction.asset_id}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{formatDate(transaction.transaction_time)}</span>
                          <span className="text-green-600 font-medium">
                            {formatICP(transaction.price)} ICP
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(TRANSACTION_STATUS_LABELS[Object.keys(transaction.status)[0]])
                      }`}>
                        {TRANSACTION_STATUS_LABELS[Object.keys(transaction.status)[0]]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600 mb-6">
                Your buying and selling activity will appear here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Listing Modal */}
      {showListingModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              List Asset for Sale
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name
                </label>
                <p className="text-gray-900">{selectedAsset.name}</p>
              </div>

              <div>
                <label htmlFor="listingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (ICP)
                </label>
                <input
                  type="number"
                  id="listingPrice"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  step="0.0001"
                  min="0"
                  className="input-field"
                  placeholder="0.0000"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowListingModal(false)
                  setSelectedAsset(null)
                  setListingPrice('')
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateListing}
                disabled={!listingPrice || listingLoading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {listingLoading ? 'Listing...' : 'List Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnedAssets
