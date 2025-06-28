import React, { useEffect, useState } from 'react'
import { useAuth } from '../services/AuthContext'
import canisterService from '../services/canisterService'
import AssetCard from '../components/AssetCard'
import { Search, Filter, Grid, List, SortAsc } from 'lucide-react'
import { ASSET_CATEGORIES, debounce, formatICP } from '../utils/helpers'

const Marketplace = () => {
  const { identity, principal } = useAuth()
  const [listings, setListings] = useState([])
  const [assets, setAssets] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [buyingAsset, setBuyingAsset] = useState(null)

  useEffect(() => {
    if (identity) {
      loadMarketplaceData()
    }
  }, [identity])

  useEffect(() => {
    filterAndSortListings()
  }, [listings, assets, searchQuery, selectedCategory, sortBy])

  const loadMarketplaceData = async () => {
    try {
      setLoading(true)
      console.log("Identity in marketplace = " , identity)
      await canisterService.initializeAgent(identity)
      console.log("Identity initialized in marketplace")
      const [listingsResult, assetsResult] = await Promise.allSettled([
        canisterService.getMarketplaceListings(),
        canisterService.getAssetsForSale()
      ])

      console.log("Asset Result = ", assetsResult);
      console.log("Listings Result = ", listingsResult);

      if (listingsResult.status === 'fulfilled') {
        console.log("Listings data:", listingsResult.value);
        setListings(listingsResult.value || [])
      }

      if (assetsResult.status === 'fulfilled') {
        console.log("Assets data:", assetsResult.value);
        setAssets(assetsResult.value || [])
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortListings = () => {
    console.log("Filtering listings, initial count:", listings.length);
    let filtered = [...listings]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.category.toLowerCase().includes(query) ||
        listing.tags.some(tag => tag.toLowerCase().includes(query))
      )
      console.log("After search filter:", filtered.length);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(listing => 
        listing.category === selectedCategory
      )
      console.log("After category filter:", filtered.length);
    }

    // Sort listings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.created_at) - Number(a.created_at)
        case 'oldest':
          return Number(a.created_at) - Number(b.created_at)
        case 'price_low':
          return Number(a.price) - Number(b.price)
        case 'price_high':
          return Number(b.price) - Number(a.price)
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    console.log("Final filtered listings:", filtered.length, filtered);
    setFilteredListings(filtered)
  }

  const debouncedSearch = debounce((query) => {
    setSearchQuery(query)
  }, 300)

  const handleSearch = (e) => {
    debouncedSearch(e.target.value)
  }

  const handleBuyAsset = async (listing) => {
    if (!listing || buyingAsset) return

    try {
      setBuyingAsset(listing.id)
      
      // Find the corresponding asset
      const asset = assets.find(a => a.id === listing.asset_id)
      if (!asset) {
        alert('Asset not found')
        return
      }

      // Check if user is trying to buy their own asset
      if (asset.owner.toString() === principal.toString()) {
        alert('You cannot buy your own asset')
        return
      }

      const result = await canisterService.buyAsset(listing.id)
      
      if ('Ok' in result) {
        alert('Asset purchased successfully!')
        // Refresh marketplace data
        await loadMarketplaceData()
      } else {
        alert(`Failed to purchase asset: ${result.Err}`)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to purchase asset. Please try again.')
    } finally {
      setBuyingAsset(null)
    }
  }

  const getAssetForListing = (listing) => {
    const asset = assets.find(a => a.id === listing.asset_id)
    if (!asset) return null

    // Combine listing and asset data
    return {
      ...asset,
      listing_id: listing.id,
      listing_title: listing.title,
      listing_description: listing.description,
      price: listing.price,
      is_for_sale: true,
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-300 animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-gray-300 animate-pulse rounded"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex space-x-4">
          <div className="h-10 w-64 bg-gray-300 animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-gray-300 animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-gray-300 animate-pulse rounded"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="asset-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-48 bg-gray-300 animate-pulse rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 animate-pulse rounded"></div>
                <div className="h-4 bg-gray-300 animate-pulse rounded w-2/3"></div>
                <div className="h-8 bg-gray-300 animate-pulse rounded mt-4"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">VR Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Discover and purchase amazing VR experiences
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search assets, categories, or tags..."
            onChange={handleSearch}
            className="input-field pl-10"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {ASSET_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                    setSortBy('newest')
                    const searchInput = document.querySelector('input[type="text"]')
                    if (searchInput) searchInput.value = ''
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredListings.length} asset{filteredListings.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredListings.length > 0 ? (
          <div className={viewMode === 'grid' ? 'asset-grid' : 'space-y-4'}>
            {filteredListings.map((listing) => {
              const asset = getAssetForListing(listing)
              if (!asset) return null

              return (
                <div key={listing.id} className={viewMode === 'list' ? 'card' : ''}>
                  {viewMode === 'list' ? (
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">{listing.category}</span>
                          <span className="text-lg font-semibold text-primary-600">
                            {formatICP(listing.price)} ICP
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleBuyAsset(listing)}
                          disabled={buyingAsset === listing.id}
                          className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buyingAsset === listing.id ? 'Buying...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AssetCard
                      asset={asset}
                      showBuyButton={true}
                      onBuy={() => handleBuyAsset(listing)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory 
                ? "Try adjusting your search criteria or filters"
                : "No assets are currently listed for sale"
              }
            </p>
            {searchQuery || selectedCategory ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                  const searchInput = document.querySelector('input[type="text"]')
                  if (searchInput) searchInput.value = ''
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={loadMarketplaceData}
                className="btn-primary"
              >
                Refresh
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Marketplace
