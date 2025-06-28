use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::{Serialize, Deserialize as SerdeDeserialize};
use std::cell::RefCell;
use std::borrow::Cow;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type AssetStore = StableBTreeMap<u64, Asset, Memory>;
type AssetIdCounter = StableBTreeMap<u8, u64, Memory>;
type FileStore = StableBTreeMap<String, Vec<u8>, Memory>;

#[derive(CandidType, Serialize, SerdeDeserialize, Clone)]
pub struct Asset {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub owner: Principal,
    pub file_hash: String,
    pub file_url: String,
    pub file_type: String, // "glb", "gltf", etc.
    pub file_size: u64,
    pub price: u64, // in e8s (1 ICP = 100_000_000 e8s)
    pub is_for_sale: bool,
    pub created_at: u64,
    pub updated_at: u64,
    pub category: String,
    pub tags: Vec<String>,
    pub preview_image_url: Option<String>,
}

impl Storable for Asset {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(CandidType, Serialize, SerdeDeserialize)]
pub struct AssetInput {
    pub name: String,
    pub description: String,
    pub file_hash: String,
    pub file_url: String,
    pub file_type: String,
    pub file_size: u64,
    pub price: u64,
    pub category: String,
    pub tags: Vec<String>,
    pub preview_image_url: Option<String>,
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static ASSETS: RefCell<AssetStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );

    static ASSET_ID_COUNTER: RefCell<AssetIdCounter> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );

    static FILES: RefCell<FileStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
}

fn get_next_asset_id() -> u64 {
    ASSET_ID_COUNTER.with(|counter| {
        let mut counter = counter.borrow_mut();
        let current_id = counter.get(&0).unwrap_or(0);
        let next_id = current_id + 1;
        counter.insert(0, next_id);
        next_id
    })
}

#[update]
fn upload_asset(asset_input: AssetInput) -> Result<Asset, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot upload assets".to_string());
    }

    let asset_id = get_next_asset_id();
    let current_time = time();

    let asset = Asset {
        id: asset_id,
        name: asset_input.name,
        description: asset_input.description,
        owner: principal,
        file_hash: asset_input.file_hash,
        file_url: asset_input.file_url,
        file_type: asset_input.file_type,
        file_size: asset_input.file_size,
        price: asset_input.price,
        is_for_sale: false, // Assets start as not for sale
        created_at: current_time,
        updated_at: current_time,
        category: asset_input.category,
        tags: asset_input.tags,
        preview_image_url: asset_input.preview_image_url,
    };

    ASSETS.with(|assets| {
        let mut assets = assets.borrow_mut();
        assets.insert(asset_id, asset.clone());
    });

    Ok(asset)
}

#[query]
fn get_asset(asset_id: u64) -> Option<Asset> {
    ASSETS.with(|assets| {
        assets.borrow().get(&asset_id)
    })
}

#[query]
fn get_user_assets(owner: Principal) -> Vec<Asset> {
    ASSETS.with(|assets| {
        assets
            .borrow()
            .iter()
            .filter(|(_, asset)| asset.owner == owner)
            .map(|(_, asset)| asset)
            .collect()
    })
}

#[query]
fn get_all_assets() -> Vec<Asset> {
    ASSETS.with(|assets| {
        assets
            .borrow()
            .iter()
            .map(|(_, asset)| asset)
            .collect()
    })
}

#[query]
fn get_assets_for_sale() -> Vec<Asset> {
    ASSETS.with(|assets| {
        assets
            .borrow()
            .iter()
            .filter(|(_, asset)| asset.is_for_sale)
            .map(|(_, asset)| asset)
            .collect()
    })
}

#[update]
fn update_asset_price(asset_id: u64, new_price: u64) -> Result<Asset, String> {
    let principal = caller();
    
    ASSETS.with(|assets| {
        let mut assets = assets.borrow_mut();
        
        match assets.get(&asset_id) {
            Some(mut asset) => {
                if asset.owner != principal {
                    return Err("Only the owner can update the asset price".to_string());
                }
                
                asset.price = new_price;
                asset.updated_at = time();
                assets.insert(asset_id, asset.clone());
                Ok(asset)
            },
            None => Err("Asset not found".to_string()),
        }
    })
}

#[update]
fn set_asset_for_sale(asset_id: u64, for_sale: bool) -> Result<Asset, String> {
    let principal = caller();
    
    ASSETS.with(|assets| {
        let mut assets = assets.borrow_mut();
        
        match assets.get(&asset_id) {
            Some(mut asset) => {
                if asset.owner != principal {
                    return Err("Only the owner can change sale status".to_string());
                }
                
                asset.is_for_sale = for_sale;
                asset.updated_at = time();
                assets.insert(asset_id, asset.clone());
                Ok(asset)
            },
            None => Err("Asset not found".to_string()),
        }
    })
}

#[update]
fn transfer_asset_ownership(asset_id: u64, new_owner: Principal) -> Result<Asset, String> {
    let principal = caller();
    
    ASSETS.with(|assets| {
        let mut assets = assets.borrow_mut();
        
        match assets.get(&asset_id) {
            Some(mut asset) => {
                if asset.owner != principal {
                    return Err("Only the owner can transfer ownership".to_string());
                }
                
                asset.owner = new_owner;
                asset.is_for_sale = false; // Remove from sale after transfer
                asset.updated_at = time();
                assets.insert(asset_id, asset.clone());
                Ok(asset)
            },
            None => Err("Asset not found".to_string()),
        }
    })
}

#[query]
fn search_assets(query: String) -> Vec<Asset> {
    let query_lower = query.to_lowercase();
    
    ASSETS.with(|assets| {
        assets
            .borrow()
            .iter()
            .filter(|(_, asset)| {
                asset.name.to_lowercase().contains(&query_lower) ||
                asset.description.to_lowercase().contains(&query_lower) ||
                asset.category.to_lowercase().contains(&query_lower) ||
                asset.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .map(|(_, asset)| asset)
            .collect()
    })
}

#[query]
fn get_assets_by_category(category: String) -> Vec<Asset> {
    ASSETS.with(|assets| {
        assets
            .borrow()
            .iter()
            .filter(|(_, asset)| asset.category.to_lowercase() == category.to_lowercase())
            .map(|(_, asset)| asset)
            .collect()
    })
}

#[query]
fn get_total_assets() -> u64 {
    ASSETS.with(|assets| {
        assets.borrow().len()
    })
}

// File upload and storage methods
#[update]
fn upload_file(file_hash: String, file_data: Vec<u8>) -> Result<String, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot upload files".to_string());
    }

    // Check if file already exists
    FILES.with(|files| {
        let mut files = files.borrow_mut();
        if files.contains_key(&file_hash) {
            return Err("File already exists".to_string());
        }
        
        files.insert(file_hash.clone(), file_data);
        Ok(file_hash)
    })
}

#[query]
fn get_file(file_hash: String) -> Option<Vec<u8>> {
    FILES.with(|files| {
        files.borrow().get(&file_hash)
    })
}

#[update]
fn upload_asset_with_file(asset_input: AssetInput, file_data: Vec<u8>) -> Result<Asset, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot upload assets".to_string());
    }

    // Store the file hash before moving asset_input
    let file_hash = asset_input.file_hash.clone();

    // First upload the file
    FILES.with(|files| {
        let mut files = files.borrow_mut();
        files.insert(file_hash.clone(), file_data);
    });

    // Then create the asset record
    let asset_id = get_next_asset_id();
    let current_time = time();

    let asset = Asset {
        id: asset_id,
        name: asset_input.name,
        description: asset_input.description,
        owner: principal,
        file_hash: file_hash.clone(),
        file_url: format!("canister://{}", file_hash), // Internal canister URL
        file_type: asset_input.file_type,
        file_size: asset_input.file_size,
        price: asset_input.price,
        is_for_sale: false,
        created_at: current_time,
        updated_at: current_time,
        category: asset_input.category,
        tags: asset_input.tags,
        preview_image_url: asset_input.preview_image_url,
    };

    ASSETS.with(|assets| {
        let mut assets = assets.borrow_mut();
        assets.insert(asset_id, asset.clone());
    });

    Ok(asset)
}

#[update]
fn marketplace_transfer_asset(asset_id: u64, seller: Principal, buyer: Principal) -> Result<Asset, String> {
    let _marketplace_principal = caller();
    
    // In a production environment, you might want to maintain a list of authorized marketplace canisters
    // For now, we'll allow any canister to initiate transfers (you can add authorization later)
    
    ASSETS.with(|assets| {
        let mut assets = assets.borrow_mut();
        
        match assets.get(&asset_id) {
            Some(mut asset) => {
                // Verify the seller is the current owner
                if asset.owner != seller {
                    return Err("Seller is not the current owner of the asset".to_string());
                }
                
                // Verify the asset is for sale
                if !asset.is_for_sale {
                    return Err("Asset is not for sale".to_string());
                }
                
                // Transfer ownership
                asset.owner = buyer;
                asset.is_for_sale = false; // Remove from sale after transfer
                asset.updated_at = time();
                assets.insert(asset_id, asset.clone());
                Ok(asset)
            },
            None => Err("Asset not found".to_string()),
        }
    })
}

// Export Candid interface
ic_cdk::export_candid!();
