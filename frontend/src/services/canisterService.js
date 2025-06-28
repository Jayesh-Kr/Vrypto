import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

// Canister IDs - These would be set after deployment
const CANISTER_IDS = {
  auth: import.meta.env.REACT_APP_AUTH_CANISTER_ID,
  asset: import.meta.env.REACT_APP_ASSET_CANISTER_ID,
  marketplace: import.meta.env.REACT_APP_MARKETPLACE_CANISTER_ID
} 

console.log(CANISTER_IDS)

// console.log("Auth canister id = " + import.meta.env.REACT_APP_AUTH_CANISTER_ID);
// console.log("Asset canister id = " + import.meta.env.REACT_APP_ASSET_CANISTER_ID);
// console.log("MarketPlace canister id = " + import.meta.env.REACT_APP_MARKETPLACE_CANISTER_ID);

// Candid interface definitions
const authIdlFactory = ({ IDL }) => {
  const UserProfile = IDL.Record({
    'user_principal': IDL.Principal,
    'username': IDL.Opt(IDL.Text),
    'email': IDL.Opt(IDL.Text),
    'created_at': IDL.Nat64,
    'last_login': IDL.Nat64,
    'is_active': IDL.Bool,
  })

  return IDL.Service({
    'register_user': IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [IDL.Variant({ 'Ok': UserProfile, 'Err': IDL.Text })], []),
    'login': IDL.Func([], [IDL.Variant({ 'Ok': UserProfile, 'Err': IDL.Text })], []),
    'get_user_profile': IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'get_current_user': IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'update_user_profile': IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [IDL.Variant({ 'Ok': UserProfile, 'Err': IDL.Text })], []),
    'is_user_registered': IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'get_total_users': IDL.Func([], [IDL.Nat64], ['query']),
  })
}

const assetIdlFactory = ({ IDL }) => {
  const AssetInput = IDL.Record({
    'name': IDL.Text,
    'description': IDL.Text,
    'file_hash': IDL.Text,
    'file_url': IDL.Text,
    'file_type': IDL.Text,
    'file_size': IDL.Nat64,
    'price': IDL.Nat64,
    'category': IDL.Text,
    'tags': IDL.Vec(IDL.Text),
    'preview_image_url': IDL.Opt(IDL.Text),
  })

  const Asset = IDL.Record({
    'id': IDL.Nat64,
    'name': IDL.Text,
    'description': IDL.Text,
    'owner': IDL.Principal,
    'file_hash': IDL.Text,
    'file_url': IDL.Text,
    'file_type': IDL.Text,
    'file_size': IDL.Nat64,
    'price': IDL.Nat64,
    'is_for_sale': IDL.Bool,
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
    'category': IDL.Text,
    'tags': IDL.Vec(IDL.Text),
    'preview_image_url': IDL.Opt(IDL.Text),
  })

  return IDL.Service({
    'upload_asset': IDL.Func([AssetInput], [IDL.Variant({ 'Ok': Asset, 'Err': IDL.Text })], []),
    'upload_file': IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })], []),
    'get_file': IDL.Func([IDL.Text], [IDL.Opt(IDL.Vec(IDL.Nat8))], ['query']),
    'upload_asset_with_file': IDL.Func([AssetInput, IDL.Vec(IDL.Nat8)], [IDL.Variant({ 'Ok': Asset, 'Err': IDL.Text })], []),
    'get_asset': IDL.Func([IDL.Nat64], [IDL.Opt(Asset)], ['query']),
    'get_user_assets': IDL.Func([IDL.Principal], [IDL.Vec(Asset)], ['query']),
    'get_all_assets': IDL.Func([], [IDL.Vec(Asset)], ['query']),
    'get_assets_for_sale': IDL.Func([], [IDL.Vec(Asset)], ['query']),
    'update_asset_price': IDL.Func([IDL.Nat64, IDL.Nat64], [IDL.Variant({ 'Ok': Asset, 'Err': IDL.Text })], []),
    'set_asset_for_sale': IDL.Func([IDL.Nat64, IDL.Bool], [IDL.Variant({ 'Ok': Asset, 'Err': IDL.Text })], []),
    'transfer_asset_ownership': IDL.Func([IDL.Nat64, IDL.Principal], [IDL.Variant({ 'Ok': Asset, 'Err': IDL.Text })], []),
    'search_assets': IDL.Func([IDL.Text], [IDL.Vec(Asset)], ['query']),
    'get_assets_by_category': IDL.Func([IDL.Text], [IDL.Vec(Asset)], ['query']),
    'get_total_assets': IDL.Func([], [IDL.Nat64], ['query']),
  })
}

const marketplaceIdlFactory = ({ IDL }) => {
  const ListingInput = IDL.Record({
    'asset_id': IDL.Nat64,
    'price': IDL.Nat64,
    'title': IDL.Text,
    'description': IDL.Text,
    'category': IDL.Text,
    'tags': IDL.Vec(IDL.Text),
  })

  const Listing = IDL.Record({
    'id': IDL.Nat64,
    'asset_id': IDL.Nat64,
    'seller': IDL.Principal,
    'price': IDL.Nat64,
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
    'is_active': IDL.Bool,
    'title': IDL.Text,
    'description': IDL.Text,
    'category': IDL.Text,
    'tags': IDL.Vec(IDL.Text),
  })

  const TransactionStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Completed': IDL.Null,
    'Failed': IDL.Null,
    'Cancelled': IDL.Null,
  })

  const Transaction = IDL.Record({
    'id': IDL.Nat64,
    'asset_id': IDL.Nat64,
    'listing_id': IDL.Nat64,
    'seller': IDL.Principal,
    'buyer': IDL.Principal,
    'price': IDL.Nat64,
    'transaction_time': IDL.Nat64,
    'status': TransactionStatus,
  })

  const MarketplaceStats = IDL.Record({
    'total_listings': IDL.Nat64,
    'active_listings': IDL.Nat64,
    'total_transactions': IDL.Nat64,
    'total_volume': IDL.Nat64,
  })

  return IDL.Service({
    'create_listing': IDL.Func([ListingInput], [IDL.Variant({ 'Ok': Listing, 'Err': IDL.Text })], []),
    'get_listing': IDL.Func([IDL.Nat64], [IDL.Opt(Listing)], ['query']),
    'get_marketplace_listings': IDL.Func([], [IDL.Vec(Listing)], ['query']),
    'get_user_listings': IDL.Func([IDL.Principal], [IDL.Vec(Listing)], ['query']),
    'buy_asset': IDL.Func([IDL.Nat64], [IDL.Variant({ 'Ok': Transaction, 'Err': IDL.Text })], []),
    'update_listing_price': IDL.Func([IDL.Nat64, IDL.Nat64], [IDL.Variant({ 'Ok': Listing, 'Err': IDL.Text })], []),
    'cancel_listing': IDL.Func([IDL.Nat64], [IDL.Variant({ 'Ok': Listing, 'Err': IDL.Text })], []),
    'get_user_transactions': IDL.Func([IDL.Principal], [IDL.Vec(Transaction)], ['query']),
    'get_user_purchases': IDL.Func([IDL.Principal], [IDL.Vec(Transaction)], ['query']),
    'get_user_sales': IDL.Func([IDL.Principal], [IDL.Vec(Transaction)], ['query']),
    'search_listings': IDL.Func([IDL.Text], [IDL.Vec(Listing)], ['query']),
    'get_listings_by_category': IDL.Func([IDL.Text], [IDL.Vec(Listing)], ['query']),
    'get_marketplace_stats': IDL.Func([], [MarketplaceStats], ['query']),
  })
}

class CanisterService {
  constructor() {
    this.agent = null
    this.authActor = null
    this.assetActor = null
    this.marketplaceActor = null
  }

  async initializeAgent(identity = null) {
  try {
      const host = import.meta.env.REACT_APP_NODE_ENV === 'development' 
      ? 'http://localhost:8000' 
      : 'https://ic0.app'

    // ✅ FIXED: Detect Plug Wallet identity
    if (identity?.agent && identity?.principal) {
      
      // Extract the principal from Plug's identity structure
      const principal = identity.principal.__principal__ || identity.principal
      
      // Create a new agent with the correct host
      this.agent = new HttpAgent({ 
        host: host,  // Force correct host
        identity: null  // Plug handles auth differently
      })

      // Fetch root key for local development
        if (import.meta.env.REACT_APP_NODE_ENV === 'development') {
          await this.agent.fetchRootKey()
        }

      // Create actors normally - Plug will handle the authentication
      this.authActor = Actor.createActor(authIdlFactory, {
        agent: this.agent,
        canisterId: CANISTER_IDS.auth,
      })

      this.assetActor = Actor.createActor(assetIdlFactory, {
        agent: this.agent,
        canisterId: CANISTER_IDS.asset,
      })

      this.marketplaceActor = Actor.createActor(marketplaceIdlFactory, {
        agent: this.agent,
        canisterId: CANISTER_IDS.marketplace,
      })
      
      return
    }
    
    this.agent = new HttpAgent({ 
      host,
      identity 
    })

    // Always fetch root key for local development
      if (import.meta.env.REACT_APP_NODE_ENV === 'development') {
          await this.agent.fetchRootKey()
      }

    this.authActor = Actor.createActor(authIdlFactory, {
      agent: this.agent,
      canisterId: CANISTER_IDS.auth,
    })

    if (!CANISTER_IDS.asset) {
      throw new Error('Asset canister ID not found in environment variables')
    }

    this.assetActor = Actor.createActor(assetIdlFactory, {
      agent: this.agent,
      canisterId: CANISTER_IDS.asset,
    })

    this.marketplaceActor = Actor.createActor(marketplaceIdlFactory, {
      agent: this.agent,
      canisterId: CANISTER_IDS.marketplace,
    })

    console.log('All actors initialized successfully')
  } catch (error) {
    console.error('Agent initialization failed:', error)
    throw error
  }
}

  // Auth methods
  async registerUser(username, email) {
    if (!this.authActor) throw new Error('Auth actor not initialized')
    return await this.authActor.register_user(username ? [username] : [], email ? [email] : [])
  }

  async loginUser() {
    if (!this.authActor) throw new Error('Auth actor not initialized')
    return await this.authActor.login()
  }

  async getCurrentUser() {
    if (!this.authActor) throw new Error('Auth actor not initialized')
    return await this.authActor.get_current_user()
  }

  async getUserProfile(principal) {
    if (!this.authActor) throw new Error('Auth actor not initialized')
    return await this.authActor.get_user_profile(principal)
  }

  // Asset methods
  async uploadAsset(assetData) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.upload_asset(assetData)
  }

  async uploadFile(fileHash, fileData) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.upload_file(fileHash, fileData)
  }

  async getFile(fileHash) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.get_file(fileHash)
  }

  async uploadAssetWithFile(assetData, fileData) {
  if (!this.assetActor) throw new Error('Asset actor not initialized')
  
  try {
    // console.log('🔍 DEBUG: Original asset data:', assetData)
    // console.log('🔍 DEBUG: File data type:', typeof fileData, 'Length:', fileData ? fileData.length : 0)
    
    // // ✅ FIXED: Create data structure that matches the deployed canister exactly
    // const processedAssetData = {
    //   name: String(assetData.name || ''),
    //   description: String(assetData.description || ''),
    //   file_hash: String(assetData.file_hash || ''),
    //   file_url: String(assetData.file_url || ''),
    //   file_type: String(assetData.file_type || ''),
    //   file_size: BigInt(assetData.file_size || 0),
    //   price: BigInt(assetData.price || 0),
    //   category: String(assetData.category || ''),
    //   tags: Array.isArray(assetData.tags) ? assetData.tags.map(tag => String(tag)) : [],
    //   // ✅ CRITICAL FIX: Send null instead of empty array for None, or [value] for Some
    //   preview_image_url: (assetData.preview_image_url && assetData.preview_image_url.length > 0) 
    //     ? [String(assetData.preview_image_url[0])]  // Some(value)
    //     : []  // None
    // }
    
    // console.log('🔍 DEBUG: Processed asset data:', processedAssetData)
    // console.log('🔍 DEBUG: preview_image_url value:', processedAssetData.preview_image_url)
    
    // // ✅ Convert fileData to proper format
    // let processedFileData = [];
    // if (fileData) {
    //   if (fileData instanceof Uint8Array) {
    //     processedFileData = Array.from(fileData);
    //   } else if (Array.isArray(fileData)) {
    //     processedFileData = fileData;
    //   } else {
    //     throw new Error('Invalid file data format');
    //   }
    // }
    
    // console.log('🔍 DEBUG: Processed file data length:', processedFileData.length)
    // console.log('🔍 DEBUG: First few bytes:', processedFileData.slice(0, 10))
    
    // console.log('🚀 About to call upload_asset_with_file...')
    const result = await this.assetActor.upload_asset_with_file(assetData, fileData)
    console.log('✅ Upload successful:', result)
    return result
  } catch (error) {
    console.error('Upload asset error:', error)
    throw error
  }
}

  async getAsset(assetId) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.get_asset(assetId)
  }

  async getUserAssets(principal) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.get_user_assets(principal)
  }

  async getAllAssets() {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.get_all_assets()
  }

  async getAssetsForSale() {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    const res =  await this.assetActor.get_assets_for_sale();
    console.log("Console while calling function get asset = " , res);
    return res;
  }

  async setAssetForSale(assetId, forSale) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.set_asset_for_sale(assetId, forSale)
  }

  async updateAssetPrice(assetId, newPrice) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.update_asset_price(assetId, newPrice)
  }

  async searchAssets(query) {
    if (!this.assetActor) throw new Error('Asset actor not initialized')
    return await this.assetActor.search_assets(query)
  }

  // Marketplace methods
  async createListing(listingData) {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.create_listing(listingData)
  }

  async getMarketplaceListings() {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.get_marketplace_listings()
  }

  async getUserListings(principal) {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.get_user_listings(principal)
  }

  async buyAsset(listingId) {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.buy_asset(listingId)
  }

  async cancelListing(listingId) {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.cancel_listing(listingId)
  }

  async getUserTransactions(principal) {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.get_user_transactions(principal)
  }

  async getMarketplaceStats() {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.get_marketplace_stats()
  }

  async searchListings(query) {
    if (!this.marketplaceActor) throw new Error('Marketplace actor not initialized')
    return await this.marketplaceActor.search_listings(query)
  }

  // Helper method to get file URL for display/download
  async getAssetFileUrl(asset) {
    if (!asset.file_url.startsWith('canister://')) {
      return asset.file_url // Return as-is if not a canister URL
    }
    
    try {
      const fileHash = asset.file_url.replace('canister://', '')
      const fileBytes = await this.getFile(fileHash)
      
      if (fileBytes && fileBytes.length > 0) {
        // Convert bytes to blob and create object URL
        const uint8Array = new Uint8Array(fileBytes)
        const blob = new Blob([uint8Array], { 
          type: this.getMimeTypeFromFileType(asset.file_type) 
        })
        return URL.createObjectURL(blob)
      }
      return null
    } catch (error) {
      console.error('Error fetching file from canister:', error)
      return null
    }
  }

  // Get preview image URL
  async getPreviewImageUrl(asset) {
    if (!asset.preview_image_url || asset.preview_image_url.length === 0) {
      return null
    }
    
    const previewUrl = asset.preview_image_url[0]
    
    if (!previewUrl.startsWith('canister://')) {
      return previewUrl // Return as-is if not a canister URL
    }
    
    try {
      const fileHash = previewUrl.replace('canister://', '')
      const fileBytes = await this.getFile(fileHash)
      
      if (fileBytes && fileBytes.length > 0) {
        const uint8Array = new Uint8Array(fileBytes)
        const blob = new Blob([uint8Array], { type: 'image/jpeg' }) // Assume JPEG for preview
        return URL.createObjectURL(blob)
      }
      return null
    } catch (error) {
      console.error('Error fetching preview image from canister:', error)
      return null
    }
  }

  // Helper to get MIME type from file extension
  getMimeTypeFromFileType(fileType) {
    const mimeTypes = {
      'glb': 'model/gltf-binary',
      'gltf': 'model/gltf+json',
      'obj': 'application/octet-stream',
      'fbx': 'application/octet-stream',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    }
    return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream'
  }
}

// Export singleton instance
export const canisterService = new CanisterService()
export default canisterService
