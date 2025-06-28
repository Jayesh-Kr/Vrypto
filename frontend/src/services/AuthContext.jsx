import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthClient } from '@dfinity/auth-client'
import { Principal } from '@dfinity/principal'
import { timeout } from '@dfinity/agent/lib/cjs/polling/strategy'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [principal, setPrincipal] = useState(null)
  const [identity, setIdentity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      const client = await AuthClient.create()
      setAuthClient(client)

      const authenticated = await client.isAuthenticated()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        const identity = client.getIdentity()
        const principal = identity.getPrincipal()
        setIdentity(identity)
        setPrincipal(principal)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    if (!authClient) return

    try {
      setLoading(true)
      
      // Use Internet Identity for authentication
      await authClient.login({
        identityProvider: import.meta.env.REACT_APP_NODE_ENV === 'development' 
          ? `http://${import.meta.env.REACT_APP_INTERNET_IDENTITY_CANISTER_ID}.localhost:8000`
          : 'https://identity.ic0.app',
        // identityProvider: import.meta.env.REACT_APP_NODE_ENV === 'development' 
        //   ? `http://127.0.0.1:8000?canisterId=${import.meta.env.REACT_APP_INTERNET_IDENTITY_CANISTER_ID}`
        //   : 'https://identity.ic0.app',
        onSuccess: () => {
          const identity = authClient.getIdentity()
          const principal = identity.getPrincipal()
          setIdentity(identity)
          setPrincipal(principal)
          setIsAuthenticated(true)
        },
        onError: (error) => {
          console.error('Login error:', error)
        }
      })
    } catch (error) {
      console.error('Login process error:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    if (!authClient) return

    try {
      setLoading(true)
      await authClient.logout()
      setIsAuthenticated(false)
      setPrincipal(null)
      setIdentity(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loginWithPlug = async () => {
    try {
      setLoading(true)
      
      // Check if Plug wallet is available
      if (!window.ic?.plug) {
        alert('Plug wallet not detected. Please install Plug wallet extension.')
        return
      }

      // if(window.ic.plug.isConnected) {
      //   await window.ic.plug.disconnect();
      // }

      // Request connection
      const connected = await window.ic.plug.requestConnect({
        whitelist: [
          import.meta.env.REACT_APP_AUTH_CANISTER_ID,
          import.meta.env.REACT_APP_ASSET_CANISTER_ID,
          import.meta.env.REACT_APP_MARKETPLACE_CANISTER_ID,
        ],
        host : 'http://localhost:8000',
        // host: import.meta.env.REACT_APP_NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://ic0.app',
        timeout : 50000
      })

      if (connected) {
        
        console.log('✅ Plug connected to local network')
      console.log('🔍 Plug agent host:', window.ic.plug.agent.options.host)
      console.log("Plug agent : ", window.ic.plug.agent)
        const principal = Principal.fromText(window.ic.plug.principalId)
        setPrincipal(principal)
        setIsAuthenticated(true)
        // setIdentity(window.ic.plug.agent)
        setIdentity({
          agent : window.ic.plug.agent,
          principal : principal,
          isPlugWallet : true
        })
      }
    } catch (error) {
      console.error('Plug login error:', error)
      alert('Failed to connect with Plug wallet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const value = {
    authClient,
    isAuthenticated,
    principal,
    identity,
    loading,
    login,
    logout,
    loginWithPlug,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
