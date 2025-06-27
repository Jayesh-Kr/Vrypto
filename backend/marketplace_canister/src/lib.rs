use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};
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
fn buy_asset(listing_id: u64) -> Result<Transaction, String> {
    let buyer = caller();
    
    if buyer == Principal::anonymous() {
        return Err("Anonymous users cannot buy assets".to_string());
    }

    LISTINGS.with(|listings| {
        let mut listings = listings.borrow_mut();
        
        match listings.get(&listing_id) {
            Some(mut listing) => {
                if !listing.is_active {
                    return Err("Listing is not active".to_string());
                }
                
                if listing.seller == buyer {
                    return Err("Cannot buy your own asset".to_string());
                }

                // Deactivate the listing
                listing.is_active = false;
                listing.updated_at = time();
                listings.insert(listing_id, listing.clone());

                // Create transaction record
                let transaction_id = get_next_transaction_id();
                let transaction = Transaction {
                    id: transaction_id,
                    asset_id: listing.asset_id,
                    listing_id,
                    seller: listing.seller,
                    buyer,
                    price: listing.price,
                    transaction_time: time(),
                    status: TransactionStatus::Completed, // In a real implementation, this would be Pending until payment is confirmed
                };

                TRANSACTIONS.with(|transactions| {
                    let mut transactions = transactions.borrow_mut();
                    transactions.insert(transaction_id, transaction.clone());
                });

                Ok(transaction)
            },
            None => Err("Listing not found".to_string()),
        }
    })
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

// Export Candid interface
ic_cdk::export_candid!();
