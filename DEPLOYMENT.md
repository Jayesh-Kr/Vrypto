# VR Marketplace Deployment Guide

This guide walks you through deploying the VR Marketplace on the Internet Computer.

## Prerequisites

- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) installed
- [Node.js](https://nodejs.org/) v16+ installed
- [Rust](https://rustup.rs/) installed
- ICP tokens for mainnet deployment (optional)

## Local Development Deployment

### 1. Start Local Replica
```bash
# Start the local Internet Computer replica
dfx start --background

# Verify it's running
dfx ping
```

### 2. Deploy Canisters
```bash
# Deploy all canisters locally
dfx deploy

# Or deploy individually
dfx deploy auth_canister
dfx deploy asset_canister
dfx deploy marketplace_canister
dfx deploy frontend
```

### 3. Get Canister IDs
```bash
# Display all canister IDs
dfx canister id --all

# Individual canister IDs
dfx canister id auth_canister
dfx canister id asset_canister
dfx canister id marketplace_canister
dfx canister id frontend
```

### 4. Configure Frontend
Create `frontend/.env`:
```env
REACT_APP_AUTH_CANISTER_ID=<auth_canister_id>
REACT_APP_ASSET_CANISTER_ID=<asset_canister_id>
REACT_APP_MARKETPLACE_CANISTER_ID=<marketplace_canister_id>
REACT_APP_INTERNET_IDENTITY_CANISTER_ID=rdmx6-jaaaa-aaaah-qdrpq-cai
```

### 5. Build and Start Frontend
```bash
cd frontend
npm install
npm run build
cd ..

# Deploy updated frontend
dfx deploy frontend
```

### 6. Access Application
- Local frontend: `http://localhost:8000/?canisterId=<frontend_canister_id>`
- Candid UI: `http://localhost:8000/_/candid?canisterId=<canister_id>`

## Internet Computer Mainnet Deployment

### 1. Create Internet Identity
1. Visit [Internet Identity](https://identity.ic0.app)
2. Create a new Internet Identity
3. Save your anchor number securely

### 2. Install Plug Wallet (Optional)
1. Install [Plug Wallet](https://plugwallet.ooo/) browser extension
2. Create a new wallet
3. Fund with ICP tokens

### 3. Setup DFX for Mainnet
```bash
# Create identity (if not already done)
dfx identity new deployment
dfx identity use deployment

# Get principal ID
dfx identity get-principal
```

### 4. Get Cycles
You need cycles to deploy to mainnet. Options:

#### Option A: Convert ICP to Cycles
```bash
# Check ICP balance
dfx wallet --network ic balance

# Convert ICP to cycles (requires ICP in wallet)
dfx wallet --network ic redeem-faucet-coupon <coupon_code>
```

#### Option B: Use Cycles Faucet (Development Only)
```bash
# Get free cycles for development
dfx wallet --network ic redeem-faucet-coupon <faucet_coupon>
```

### 5. Deploy to Mainnet
```bash
# Deploy all canisters to mainnet
dfx deploy --network ic

# Check deployment status
dfx canister --network ic status --all
```

### 6. Update Frontend for Mainnet
Update `frontend/.env` with mainnet canister IDs:
```env
REACT_APP_AUTH_CANISTER_ID=<mainnet_auth_canister_id>
REACT_APP_ASSET_CANISTER_ID=<mainnet_asset_canister_id>
REACT_APP_MARKETPLACE_CANISTER_ID=<mainnet_marketplace_canister_id>
REACT_APP_INTERNET_IDENTITY_CANISTER_ID=rdmx6-jaaaa-aaaah-qdrpq-cai
NODE_ENV=production
```

### 7. Build and Deploy Frontend
```bash
cd frontend
npm run build
cd ..

# Deploy frontend to mainnet
dfx deploy --network ic frontend
```

### 8. Access Mainnet Application
Your app will be available at:
`https://<frontend_canister_id>.ic0.app`

## Post-Deployment Configuration

### 1. Initialize Canisters
```bash
# Check if canisters need initialization
dfx canister call auth_canister get_total_users
dfx canister call asset_canister get_total_assets
dfx canister call marketplace_canister get_marketplace_stats
```

### 2. Test Basic Functionality
```bash
# Test auth canister
dfx canister call auth_canister is_user_registered '(principal "2vxsx-fae")'

# Test asset canister
dfx canister call asset_canister get_all_assets

# Test marketplace canister
dfx canister call marketplace_canister get_marketplace_listings
```

## Environment-Specific Commands

### Local Development
```bash
# Start local replica
dfx start --background

# Deploy with hot reload
dfx deploy && cd frontend && npm start

# Reset local state
dfx stop && dfx start --clean
```

### Mainnet Production
```bash
# Deploy to mainnet
dfx deploy --network ic

# Monitor canister status
dfx canister --network ic status --all

# Check cycles balance
dfx wallet --network ic balance
```

## Troubleshooting

### Common Issues

#### 1. Canister Out of Cycles
```bash
# Check cycles
dfx wallet --network ic balance

# Add cycles to canister
dfx wallet --network ic send <canister_id> <amount>
```

#### 2. Frontend Build Issues
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. Canister Upgrade Failures
```bash
# Reinstall canister (warning: loses data)
dfx canister install --mode reinstall <canister_name>

# Upgrade with specific mode
dfx canister install --mode upgrade <canister_name>
```

#### 4. Network Connection Issues
```bash
# Check DFX version
dfx --version

# Update DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Verify network connection
dfx ping
```

## Monitoring and Maintenance

### 1. Monitor Canister Health
```bash
# Check canister status
dfx canister status --all --network ic

# View canister logs
dfx canister logs <canister_name> --network ic
```

### 2. Update Canisters
```bash
# Build new version
dfx build

# Upgrade canisters
dfx canister install --mode upgrade --all --network ic
```

### 3. Backup Strategies
```bash
# Export canister state (if supported)
dfx canister call <canister_name> export_data

# Backup canister IDs and configuration
echo "Backend canisters:" > deployment-info.txt
dfx canister id --all >> deployment-info.txt
```

## Security Considerations

### 1. Canister Security
- Review all canister code before deployment
- Use stable memory for persistent data
- Implement proper access controls
- Regular security audits

### 2. Frontend Security
- Validate all user inputs
- Use HTTPS in production
- Implement CSP headers
- Regular dependency updates

### 3. Operational Security
- Secure private keys and identities
- Monitor canister cycles
- Regular backups
- Access logging

## Cost Optimization

### 1. Cycles Management
- Monitor cycles consumption
- Optimize canister memory usage
- Use efficient data structures
- Regular cleanup of unused data

### 2. Storage Optimization
- Compress large assets
- Use IPFS for large files
- Implement data pagination
- Archive old transactions

---

For additional support, consult the [Internet Computer documentation](https://internetcomputer.org/docs/) or join the [developer community](https://forum.dfinity.org/).
