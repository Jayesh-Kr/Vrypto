import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import canisterService from '../services/canisterService'
import { Shield, Wallet, Zap } from 'lucide-react'

const Login = () => {
  const { isAuthenticated, login, loginWithPlug, loading } = useAuth()
  const [loginMethod, setLoginMethod] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => {
    // Initialize canister service
    canisterService.initializeAgent()
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (method) => {
    setIsLogging(true)
    setLoginMethod(method)

    try {
      if (method === 'ii') {
        await login()
      } else if (method === 'plug') {
        await loginWithPlug()
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLogging(false)
      setLoginMethod('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">VR</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to VR Marketplace
          </h2>
          <p className="text-gray-600">
            Create, buy, and sell VR experiences on the Internet Computer
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Decentralized & Secure</h3>
              <p className="text-sm text-gray-600">Powered by Internet Computer blockchain</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex-shrink-0">
              <Wallet className="h-8 w-8 text-accent-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Own Your Assets</h3>
              <p className="text-sm text-gray-600">True ownership with smart contracts</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Immersive VR</h3>
              <p className="text-sm text-gray-600">View assets in virtual reality</p>
            </div>
          </div>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Your Wallet</h3>
            
            <div className="space-y-3">
              {/* Internet Identity Login */}
              <button
                onClick={() => handleLogin('ii')}
                disabled={isLogging}
                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                  isLogging && loginMethod === 'ii'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isLogging && loginMethod === 'ii' ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner w-4 h-4 border-white border-opacity-25 border-t-white"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    </div>
                    <span>Internet Identity</span>
                  </div>
                )}
              </button>

              {/* Plug Wallet Login */}
              <button
                onClick={() => handleLogin('plug')}
                disabled={isLogging}
                className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium transition-colors ${
                  isLogging && loginMethod === 'plug'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isLogging && loginMethod === 'plug' ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner w-4 h-4"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded"></div>
                    <span>Plug Wallet</span>
                  </div>
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                New to Internet Computer?{' '}
                <a 
                  href="https://identity.ic0.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create Internet Identity
                </a>
                {' or '}
                <a 
                  href="https://plugwallet.ooo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Get Plug Wallet
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            By connecting, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
            {' and '}
            <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
