use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk::{caller, query, update, call};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::{Serialize, Deserialize as SerdeDeserialize};
use std::cell::RefCell;
use std::borrow::Cow;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type ListingStore = StableBTreeMap<u64, Listing, Memory>;
type TransactionStore = StableBTreeMap<u64, Transaction, Memory>;
type ListingIdCounter = StableBTreeMap<u8, u64, Memory>;
type TransactionIdCounter = StableBTreeMap<u8, u64, Memory>;
type ConfigStore = StableBTreeMap<String, String, Memory>;

#[derive(CandidType, Serialize, SerdeDeserialize, Clone)]
pub struct Listing {
    pub id: u64,
    pub asset_id: u64,
    pub seller: Principal,
    pub price: u64, // in e8s
    pub created_at: u64,
    pub updated_at: u64,
    pub is_active: bool,
    pub title: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
}

impl Storable for Listing {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Serialize, SerdeDeserialize, Clone)]
pub struct Transaction {
    pub id: u64,
    pub asset_id: u64,
    pub listing_id: u64,
    pub seller: Principal,
    pub buyer: Principal,
    pub price: u64,
    pub transaction_time: u64,
    pub status: TransactionStatus,
}

impl Storable for Transaction {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Serialize, SerdeDeserialize, Clone)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
    Cancelled,
}

#[derive(CandidType, Serialize, SerdeDeserialize)]
pub struct ListingInput {
    pub asset_id: u64,
    pub price: u64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
}

#[derive(CandidType, Serialize, SerdeDeserialize)]
pub struct MarketplaceStats {
    pub total_listings: u64,
    pub active_listings: u64,
    pub total_transactions: u64,
    pub total_volume: u64, // in e8s
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static LISTINGS: RefCell<ListingStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static TRANSACTIONS: RefCell<TransactionStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );

    static LISTING_ID_COUNTER: RefCell<ListingIdCounter> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );

    static TRANSACTION_ID_COUNTER: RefCell<TransactionIdCounter> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
        )
    );

    static CONFIG: RefCell<ConfigStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))),
        )
    );
}

fn get_next_listing_id() -> u64 {
    LISTING_ID_COUNTER.with(|counter| {
        let mut counter = counter.borrow_mut();
        let current_id = counter.get(&0).unwrap_or(0);
        let next_id = current_id + 1;
        counter.insert(0, next_id);
        next_id
    })
}

fn get_next_transaction_id() -> u64 {
    TRANSACTION_ID_COUNTER.with(|counter| {
        let mut counter = counter.borrow_mut();
        let current_id = counter.get(&0).unwrap_or(0);
        let next_id = current_id + 1;
        counter.insert(0, next_id);
        next_id
    })
}

#[update]
fn create_listing(listing_input: ListingInput) -> Result<Listing, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot create listings".to_string());
    }

    let listing_id = get_next_listing_id();
    let current_time = time();

    let listing = Listing {
        id: listing_id,
        asset_id: listing_input.asset_id,
        seller: principal,
        price: listing_input.price,
        created_at: current_time,
        updated_at: current_time,
        is_active: true,
        title: listing_input.title,
        description: listing_input.description,
        category: listing_input.category,
        tags: listing_input.tags,
    };

    LISTINGS.with(|listings| {
        let mut listings = listings.borrow_mut();
        listings.insert(listing_id, listing.clone());
    });

    Ok(listing)
}

#[query]
fn get_listing(listing_id: u64) -> Option<Listing> {
    LISTINGS.with(|listings| {
        listings.borrow().get(&listing_id)
    })
}

#[query]
fn get_marketplace_listings() -> Vec<Listing> {
    LISTINGS.with(|listings| {
        listings
            .borrow()
            .iter()
            .filter(|(_, listing)| listing.is_active)
            .map(|(_, listing)| listing)
            .collect()
    })
}

#[query]
fn get_user_listings(seller: Principal) -> Vec<Listing> {
    LISTINGS.with(|listings| {
        listings
            .borrow()
            .iter()
            .filter(|(_, listing)| listing.seller == seller)
            .map(|(_, listing)| listing)
            .collect()
    })
}

#[update]
async fn buy_asset(listing_id: u64) -> Result<Transaction, String> {
    let buyer = caller();
    
    if buyer == Principal::anonymous() {
        return Err("Anonymous users cannot buy assets".to_string());
    }

    // Get the asset canister principal
    let asset_canister_principal = get_asset_canister_principal()?;

    // Get the listing and validate it
    let (listing, transaction_id) = LISTINGS.with(|listings| {
        let mut listings = listings.borrow_mut();
        
        match listings.get(&listing_id) {
            Some(mut listing) => {
                if !listing.is_active {
                    return Err("Listing is not active".to_string());
                }
                
                if listing.seller == buyer {
                    return Err("Cannot buy your own asset".to_string());
                }

                // Deactivate the listing temporarily
                listing.is_active = false;
                listing.updated_at = time();
                listings.insert(listing_id, listing.clone());

                // Get next transaction ID
                let transaction_id = get_next_transaction_id();
                
                Ok((listing, transaction_id))
            },
            None => Err("Listing not found".to_string()),
        }
    })?;

    // Create initial transaction record with Pending status
    let mut transaction = Transaction {
        id: transaction_id,
        asset_id: listing.asset_id,
        listing_id,
        seller: listing.seller,
        buyer,
        price: listing.price,
        transaction_time: time(),
        status: TransactionStatus::Pending,
    };

    TRANSACTIONS.with(|transactions| {
        let mut transactions = transactions.borrow_mut();
        transactions.insert(transaction_id, transaction.clone());
    });

    // Define a struct to match the Asset return type from the asset canister
    #[derive(CandidType, Serialize, SerdeDeserialize)]
    struct AssetResult {
        id: u64,
        name: String,
        description: String,
        owner: Principal,
        file_hash: String,
        file_url: String,
        file_type: String,
        file_size: u64,
        price: u64,
        is_for_sale: bool,
        created_at: u64,
        updated_at: u64,
        category: String,
        tags: Vec<String>,
        preview_image_url: Option<String>,
    }

    // Now attempt to transfer ownership via inter-canister call
    let transfer_result: Result<(Result<AssetResult, String>,), _> = call(
        asset_canister_principal,
        "marketplace_transfer_asset", 
        (listing.asset_id, listing.seller, buyer),
    ).await;

    match transfer_result {
        Ok((Ok(_asset),)) => {
            // Transfer successful, update transaction status
            transaction.status = TransactionStatus::Completed;
            TRANSACTIONS.with(|transactions| {
                let mut transactions = transactions.borrow_mut();
                transactions.insert(transaction_id, transaction.clone());
            });
            Ok(transaction)
        },
        Ok((Err(transfer_err),)) => {
            // Transfer failed, mark transaction as failed and reactivate listing
            transaction.status = TransactionStatus::Failed;
            TRANSACTIONS.with(|transactions| {
                let mut transactions = transactions.borrow_mut();
                transactions.insert(transaction_id, transaction.clone());
            });

            // Reactivate the listing
            LISTINGS.with(|listings| {
                let mut listings = listings.borrow_mut();
                if let Some(mut reactivated_listing) = listings.get(&listing_id) {
                    reactivated_listing.is_active = true;
                    listings.insert(listing_id, reactivated_listing);
                }
            });

            Err(format!("Failed to transfer asset ownership: {}", transfer_err))
        },
        Err(call_err) => {
            // Inter-canister call failed
            transaction.status = TransactionStatus::Failed;
            TRANSACTIONS.with(|transactions| {
                let mut transactions = transactions.borrow_mut();
                transactions.insert(transaction_id, transaction.clone());
            });

            // Reactivate the listing
            LISTINGS.with(|listings| {
                let mut listings = listings.borrow_mut();
                if let Some(mut reactivated_listing) = listings.get(&listing_id) {
                    reactivated_listing.is_active = true;
                    listings.insert(listing_id, reactivated_listing);
                }
            });

            Err(format!("Inter-canister call failed: {:?}", call_err))
        }
    }
}

#[update]
fn update_listing_price(listing_id: u64, new_price: u64) -> Result<Listing, String> {
    let principal = caller();
    
    LISTINGS.with(|listings| {
        let mut listings = listings.borrow_mut();
        
        match listings.get(&listing_id) {
            Some(mut listing) => {
                if listing.seller != principal {
                    return Err("Only the seller can update the listing price".to_string());
                }
                
                if !listing.is_active {
                    return Err("Cannot update price of inactive listing".to_string());
                }
                
                listing.price = new_price;
                listing.updated_at = time();
                listings.insert(listing_id, listing.clone());
                Ok(listing)
            },
            None => Err("Listing not found".to_string()),
        }
    })
}

#[update]
fn cancel_listing(listing_id: u64) -> Result<Listing, String> {
    let principal = caller();
    
    LISTINGS.with(|listings| {
        let mut listings = listings.borrow_mut();
        
        match listings.get(&listing_id) {
            Some(mut listing) => {
                if listing.seller != principal {
                    return Err("Only the seller can cancel the listing".to_string());
                }
                
                listing.is_active = false;
                listing.updated_at = time();
                listings.insert(listing_id, listing.clone());
                Ok(listing)
            },
            None => Err("Listing not found".to_string()),
        }
    })
}

#[query]
fn get_user_transactions(user: Principal) -> Vec<Transaction> {
    TRANSACTIONS.with(|transactions| {
        transactions
            .borrow()
            .iter()
            .filter(|(_, transaction)| transaction.buyer == user || transaction.seller == user)
            .map(|(_, transaction)| transaction)
            .collect()
    })
}

#[query]
fn get_user_purchases(buyer: Principal) -> Vec<Transaction> {
    TRANSACTIONS.with(|transactions| {
        transactions
            .borrow()
            .iter()
            .filter(|(_, transaction)| transaction.buyer == buyer)
            .map(|(_, transaction)| transaction)
            .collect()
    })
}

#[query]
fn get_user_sales(seller: Principal) -> Vec<Transaction> {
    TRANSACTIONS.with(|transactions| {
        transactions
            .borrow()
            .iter()
            .filter(|(_, transaction)| transaction.seller == seller)
            .map(|(_, transaction)| transaction)
            .collect()
    })
}

#[query]
fn search_listings(query: String) -> Vec<Listing> {
    let query_lower = query.to_lowercase();
    
    LISTINGS.with(|listings| {
        listings
            .borrow()
            .iter()
            .filter(|(_, listing)| {
                listing.is_active && (
                    listing.title.to_lowercase().contains(&query_lower) ||
                    listing.description.to_lowercase().contains(&query_lower) ||
                    listing.category.to_lowercase().contains(&query_lower) ||
                    listing.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
                )
            })
            .map(|(_, listing)| listing)
            .collect()
    })
}

#[query]
fn get_listings_by_category(category: String) -> Vec<Listing> {
    LISTINGS.with(|listings| {
        listings
            .borrow()
            .iter()
            .filter(|(_, listing)| {
                listing.is_active && listing.category.to_lowercase() == category.to_lowercase()
            })
            .map(|(_, listing)| listing)
            .collect()
    })
}

#[query]
fn get_marketplace_stats() -> MarketplaceStats {
    let total_listings = LISTINGS.with(|listings| {
        listings.borrow().len()
    });

    let active_listings = LISTINGS.with(|listings| {
        listings
            .borrow()
            .iter()
            .filter(|(_, listing)| listing.is_active)
            .count() as u64
    });

    let (total_transactions, total_volume) = TRANSACTIONS.with(|transactions| {
        let transactions = transactions.borrow();
        let total_count = transactions.len();
        let total_vol = transactions
            .iter()
            .filter(|(_, transaction)| matches!(transaction.status, TransactionStatus::Completed))
            .map(|(_, transaction)| transaction.price)
            .sum();
        (total_count, total_vol)
    });

    MarketplaceStats {
        total_listings,
        active_listings,
        total_transactions,
        total_volume,
    }
}

#[update]
fn set_asset_canister_id(canister_id: String) -> Result<String, String> {
    let principal = caller();
    
    // In a production environment, you might want to restrict this to admin users
    // For now, we'll allow any authenticated user to set it
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot set canister ID".to_string());
    }

    CONFIG.with(|config| {
        let mut config = config.borrow_mut();
        config.insert("asset_canister_id".to_string(), canister_id.clone());
    });

    Ok(canister_id)
}

#[query]
fn get_asset_canister_id() -> Option<String> {
    CONFIG.with(|config| {
        config.borrow().get(&"asset_canister_id".to_string())
    })
}

fn get_asset_canister_principal() -> Result<Principal, String> {
    CONFIG.with(|config| {
        match config.borrow().get(&"asset_canister_id".to_string()) {
            Some(canister_id) => {
                Principal::from_text(canister_id).map_err(|_| "Invalid canister ID format".to_string())
            },
            None => Err("Asset canister ID not configured".to_string()),
        }
    })
}

// Export Candid interface
ic_cdk::export_candid!();
