import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import canisterService from '../services/canisterService'
import { formatICP, formatDate } from '../utils/helpers'
import { 
  Upload, 
  ShoppingBag, 
  Wallet, 
  TrendingUp, 
  Users, 
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react'

const Dashboard = () => {
  const { principal, identity } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [userAssets, setUserAssets] = useState([])
  const [userTransactions, setUserTransactions] = useState([])
  const [marketplaceStats, setMarketplaceStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (principal && identity) {
      initializeDashboard()
    }
  }, [principal, identity])

  const initializeDashboard = async () => {
    try {
      setLoading(true)
      await canisterService.initializeAgent(identity)
      
      // Load user data in parallel
      const [
        profileResult,
        assetsResult,
        transactionsResult,
        statsResult
      ] = await Promise.allSettled([
        canisterService.getCurrentUser(),
        canisterService.getUserAssets(principal),
        canisterService.getUserTransactions(principal),
        canisterService.getMarketplaceStats()
      ])

      if (profileResult.status === 'fulfilled') {
        setUserProfile(profileResult.value[0] || null)
      }

      if (assetsResult.status === 'fulfilled') {
        setUserAssets(assetsResult.value || [])
      }

      if (transactionsResult.status === 'fulfilled') {
        setUserTransactions(transactionsResult.value || [])
      }

      if (statsResult.status === 'fulfilled') {
        setMarketplaceStats(statsResult.value)
      }

      // Register user if not already registered
      if (!profileResult.value || !profileResult.value[0]) {
        try {
          await canisterService.registerUser([], [])
          const newProfile = await canisterService.getCurrentUser()
          setUserProfile(newProfile[0] || null)
        } catch (regError) {
          console.log('User might already be registered:', regError)
        }
      }

    } catch (error) {
      console.error('Dashboard initialization error:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-6 bg-gray-300 animate-pulse rounded mb-2"></div>
              <div className="h-8 bg-gray-300 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="h-6 bg-gray-300 animate-pulse rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="h-6 bg-gray-300 animate-pulse rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={initializeDashboard}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  const totalAssetValue = userAssets.reduce((total, asset) => total + Number(asset.price), 0)
  const completedTransactions = userTransactions.filter(tx => 
    tx.status && 'Completed' in tx.status
  ).length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center py-8 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to VR Marketplace
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create, buy, and sell immersive VR experiences on the Internet Computer blockchain
        </p>
        {userProfile && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Member since {formatDate(userProfile.created_at)}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wallet className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">My Assets</div>
              <div className="text-2xl font-bold text-gray-900">{userAssets.length}</div>
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
                {formatICP(totalAssetValue)} ICP
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBag className="h-8 w-8 text-accent-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{completedTransactions}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Users</div>
              <div className="text-2xl font-bold text-gray-900">
                {marketplaceStats?.total_listings || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/upload"
          className="card hover:shadow-lg transition-all duration-300 group cursor-pointer"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Asset</h3>
            <p className="text-gray-600 text-sm">
              Share your VR creations with the world
            </p>
            <div className="flex items-center justify-center mt-4 text-primary-600 group-hover:text-primary-700">
              <span className="mr-2">Get started</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link
          to="/marketplace"
          className="card hover:shadow-lg transition-all duration-300 group cursor-pointer"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-200 transition-colors">
              <ShoppingBag className="h-8 w-8 text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Marketplace</h3>
            <p className="text-gray-600 text-sm">
              Discover amazing VR experiences
            </p>
            <div className="flex items-center justify-center mt-4 text-accent-600 group-hover:text-accent-700">
              <span className="mr-2">Explore now</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link
          to="/assets"
          className="card hover:shadow-lg transition-all duration-300 group cursor-pointer"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Collection</h3>
            <p className="text-gray-600 text-sm">
              Manage your VR asset portfolio
            </p>
            <div className="flex items-center justify-center mt-4 text-green-600 group-hover:text-green-700">
              <span className="mr-2">View assets</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assets */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Assets</h3>
            <Link to="/assets" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {userAssets.length > 0 ? (
            <div className="space-y-4">
              {userAssets.slice(0, 3).map((asset) => (
                <div key={asset.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {asset.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatICP(asset.price)} ICP
                    </p>
                  </div>
                  <Link
                    to={`/vr-viewer/${asset.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No assets yet</p>
              <Link to="/upload" className="btn-primary">
                Upload your first asset
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Link to="/assets" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {userTransactions.length > 0 ? (
            <div className="space-y-4">
              {userTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💎</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.buyer.toString() === principal.toString() ? 'Purchased' : 'Sold'} Asset
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatICP(transaction.price)} ICP
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {formatDate(transaction.transaction_time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No transactions yet</p>
              <Link to="/marketplace" className="btn-primary">
                Browse marketplace
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
