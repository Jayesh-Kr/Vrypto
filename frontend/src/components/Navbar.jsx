import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { formatPrincipal } from '../utils/helpers'
import { ShoppingBag, Upload, Home, User, LogOut, Wallet } from 'lucide-react'

const Navbar = () => {
  const { isAuthenticated, principal, logout, loading } = useAuth()
  const location = useLocation()

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-300 animate-pulse rounded"></div>
            </div>
            <div className="h-8 w-24 bg-gray-300 animate-pulse rounded"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VR</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Marketplace</span>
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/') 
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/marketplace"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/marketplace') 
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag size={18} />
                <span>Marketplace</span>
              </Link>

              <Link
                to="/upload"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/upload') 
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Upload size={18} />
                <span>Upload</span>
              </Link>

              <Link
                to="/assets"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/assets') 
                    ? 'bg-primary-50 text-primary-600 font-medium' 
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Wallet size={18} />
                <span>My Assets</span>
              </Link>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{formatPrincipal(principal)}</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary"
              >
                Connect Wallet
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex items-center justify-around">
              <Link
                to="/"
                className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                  isActivePath('/') 
                    ? 'text-primary-600' 
                    : 'text-gray-600'
                }`}
              >
                <Home size={20} />
                <span className="text-xs mt-1">Home</span>
              </Link>

              <Link
                to="/marketplace"
                className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                  isActivePath('/marketplace') 
                    ? 'text-primary-600' 
                    : 'text-gray-600'
                }`}
              >
                <ShoppingBag size={20} />
                <span className="text-xs mt-1">Market</span>
              </Link>

              <Link
                to="/upload"
                className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                  isActivePath('/upload') 
                    ? 'text-primary-600' 
                    : 'text-gray-600'
                }`}
              >
                <Upload size={20} />
                <span className="text-xs mt-1">Upload</span>
              </Link>

              <Link
                to="/assets"
                className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                  isActivePath('/assets') 
                    ? 'text-primary-600' 
                    : 'text-gray-600'
                }`}
              >
                <Wallet size={20} />
                <span className="text-xs mt-1">Assets</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
