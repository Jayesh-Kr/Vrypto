import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { formatPrincipal } from '../utils/helpers'
import { ShoppingBag, Upload, Home, User, LogOut, Wallet, ChevronDown, AlertCircle } from 'lucide-react'

const Navbar = () => {
  const { isAuthenticated, principal, logout, loading, loginWithPlug, login } = useAuth()
  const location = useLocation()
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowWalletDropdown(false)
        setConnectionError(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdown on successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      setShowWalletDropdown(false)
      setConnectionError(null)
      setIsConnecting(false)
    }
  }, [isAuthenticated])

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const handleWalletConnect = () => {
    setShowWalletDropdown(!showWalletDropdown)
    setConnectionError(null)
  }

  const handlePlugLogin = async () => {
    if (isConnecting) return
    
    try {
      setIsConnecting(true)
      setConnectionError(null)
      await loginWithPlug()
    } catch (error) {
      console.error('Plug login failed:', error)
      setConnectionError('Failed to connect with Plug Wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleIILogin = async () => {
    if (isConnecting) return
    
    try {
      setIsConnecting(true)
      setConnectionError(null)
      await login()
    } catch (error) {
      console.error('Internet Identity login failed:', error)
      setConnectionError('Failed to connect with Internet Identity. Please try again.')
    } finally {
      setIsConnecting(false)
    }
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleWalletConnect}
                  disabled={isConnecting}
                  className={`btn-primary flex items-center space-x-2 ${
                    isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Wallet size={18} />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  <ChevronDown size={16} className={`transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showWalletDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Choose your wallet</h3>
                      
                      {connectionError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700">{connectionError}</p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {/* Plug Wallet */}
                        <button
                          onClick={handlePlugLogin}
                          disabled={isConnecting}
                          className={`w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                            isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">P</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-900">Plug Wallet</div>
                            <div className="text-xs text-gray-500">Browser extension wallet</div>
                          </div>
                          {isConnecting && (
                            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </button>

                        {/* Internet Identity */}
                        <button
                          onClick={handleIILogin}
                          disabled={isConnecting}
                          className={`w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                            isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">II</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-900">Internet Identity</div>
                            <div className="text-xs text-gray-500">Secure identity service</div>
                          </div>
                          {isConnecting && (
                            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </button>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                          New to IC? Choose Internet Identity for a secure, passwordless experience.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
