use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk::{caller, query, update};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::{Serialize, Deserialize as SerdeDeserialize};
use std::cell::RefCell;
use std::borrow::Cow;

type Memory = VirtualMemory<DefaultMemoryImpl>;
type IdStore = StableBTreeMap<Principal, UserProfile, Memory>;

#[derive(CandidType, Serialize, SerdeDeserialize, Clone)]
pub struct UserProfile {
    pub user_principal: Principal,
    pub username: Option<String>,
    pub email: Option<String>,
    pub created_at: u64,
    pub last_login: u64,
    pub is_active: bool,
}

impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Unbounded;
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static USERS: RefCell<IdStore> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );
}

#[update]
fn register_user(username: Option<String>, email: Option<String>) -> Result<UserProfile, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot register".to_string());
    }

    USERS.with(|users| {
        let mut users = users.borrow_mut();
        
        if users.contains_key(&principal) {
            return Err("User already registered".to_string());
        }

        let current_time = time();
        let user_profile = UserProfile {
            user_principal: principal,
            username,
            email,
            created_at: current_time,
            last_login: current_time,
            is_active: true,
        };

        users.insert(principal, user_profile.clone());
        Ok(user_profile)
    })
}

#[update]
fn login() -> Result<UserProfile, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot login".to_string());
    }

    USERS.with(|users| {
        let mut users = users.borrow_mut();
        
        match users.get(&principal) {
            Some(mut user) => {
                user.last_login = time();
                users.insert(principal, user.clone());
                Ok(user)
            },
            None => Err("User not registered".to_string()),
        }
    })
}

#[query]
fn get_user_profile(principal: Principal) -> Option<UserProfile> {
    USERS.with(|users| {
        users.borrow().get(&principal)
    })
}

#[query]
fn get_current_user() -> Option<UserProfile> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return None;
    }

    USERS.with(|users| {
        users.borrow().get(&principal)
    })
}

#[update]
fn update_user_profile(username: Option<String>, email: Option<String>) -> Result<UserProfile, String> {
    let principal = caller();
    
    if principal == Principal::anonymous() {
        return Err("Anonymous users cannot update profile".to_string());
    }

    USERS.with(|users| {
        let mut users = users.borrow_mut();
        
        match users.get(&principal) {
            Some(mut user) => {
                if let Some(new_username) = username {
                    user.username = Some(new_username);
                }
                if let Some(new_email) = email {
                    user.email = Some(new_email);
                }
                users.insert(principal, user.clone());
                Ok(user)
            },
            None => Err("User not found".to_string()),
        }
    })
}

#[query]
fn is_user_registered(principal: Principal) -> bool {
    USERS.with(|users| {
        users.borrow().contains_key(&principal)
    })
}

#[query]
fn get_total_users() -> u64 {
    USERS.with(|users| {
        users.borrow().len()
    })
}

// Export Candid interface
ic_cdk::export_candid!();
