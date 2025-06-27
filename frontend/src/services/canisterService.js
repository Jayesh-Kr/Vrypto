import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

// Canister IDs - These would be set after deployment
const CANISTER_IDS = {
  auth: process.env.REACT_APP_AUTH_CANISTER_ID || 'rrkah-fqaaa-aaaah-qcwka-cai',
  asset: process.env.REACT_APP_ASSET_CANISTER_ID || 'rdmx6-jaaaa-aaaah-qcwkq-cai',
  marketplace: process.env.REACT_APP_MARKETPLACE_CANISTER_ID || 'ryjl3-tyaaa-aaaah-qcwkw-cai',
}

// Candid interface definitions
const authIdlFactory = ({ IDL }) => {
  const UserProfile = IDL.Record({
    'principal': IDL.Principal,
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
    const host = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000' 
      : 'https://ic0.app'

    this.agent = new HttpAgent({ 
      host,
      identity 
    })

    // Fetch root key for local development
    if (process.env.NODE_ENV === 'development') {
      await this.agent.fetchRootKey()
    }

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
    return await this.assetActor.get_assets_for_sale()
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
}

// Export singleton instance
export const canisterService = new CanisterService()
export default canisterService
