# VR Marketplace on Internet Computer

A decentralized VR asset marketplace built on the Internet Computer blockchain, featuring React frontend and Rust backend canisters.

## 🚀 Features

- **Decentralized Asset Trading**: Buy and sell VR assets with smart contracts
- **Immersive VR Viewing**: WebXR-powered 3D asset preview using A-Frame
- **Blockchain Authentication**: Internet Identity and Plug Wallet integration
- **Asset Management**: Upload, manage, and showcase your VR creations
- **Smart Contract Logic**: All transactions handled by Rust canisters on ICP

## 🏗️ Architecture

### Frontend (React + TailwindCSS)
- **Authentication**: Internet Identity & Plug Wallet support
- **VR Viewer**: A-Frame integration for immersive 3D experiences
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **State Management**: React Context for authentication and data

### Backend (Rust Canisters)
- **Auth Canister**: User registration and identity management
- **Asset Canister**: Asset storage, metadata, and ownership tracking
- **Marketplace Canister**: Listing management, transactions, and marketplace logic

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/) (latest stable)
- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (Internet Computer SDK)
- [Git](https://git-scm.com/)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vr-marketplace
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Start DFX
```bash
# Start the local Internet Computer replica
dfx start --background
```

### 4. Deploy Canisters
```bash
# Deploy all canisters to local network
dfx deploy
```

### 5. Update Frontend Configuration
After deployment, update the canister IDs in the frontend:

1. Copy the canister IDs from the deployment output
2. Create a `.env` file in the `frontend` directory:

```env
REACT_APP_AUTH_CANISTER_ID=your_auth_canister_id
REACT_APP_ASSET_CANISTER_ID=your_asset_canister_id
REACT_APP_MARKETPLACE_CANISTER_ID=your_marketplace_canister_id
REACT_APP_INTERNET_IDENTITY_CANISTER_ID=rdmx6-jaaaa-aaaah-qdrpq-cai
```

### 6. Start Frontend Development Server
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## 🔧 Development Commands

### Backend Development
```bash
# Build all canisters
dfx build

# Deploy specific canister
dfx deploy auth_canister
dfx deploy asset_canister
dfx deploy marketplace_canister

# Check canister status
dfx canister status --all

# View canister logs
dfx canister logs auth_canister
```

### Frontend Development
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run linting
npm run lint
```

## 📁 Project Structure

```
vr-marketplace/
├── backend/
│   ├── auth_canister/          # User authentication & profiles
│   │   ├── src/lib.rs
│   │   ├── Cargo.toml
│   │   └── auth_canister.did
│   ├── asset_canister/         # Asset storage & management
│   │   ├── src/lib.rs
│   │   ├── Cargo.toml
│   │   └── asset_canister.did
│   └── marketplace_canister/   # Marketplace logic & transactions
│       ├── src/lib.rs
│       ├── Cargo.toml
│       └── marketplace_canister.did
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API & authentication services
│   │   └── utils/             # Helper functions
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── dfx.json                   # DFX configuration
├── Cargo.toml                 # Workspace configuration
└── README.md
```

## 🎮 Usage Guide

### For Asset Creators
1. **Connect Wallet**: Use Internet Identity or Plug Wallet to authenticate
2. **Upload Assets**: Navigate to Upload page and submit your VR models (.glb, .gltf, .obj, .fbx)
3. **Set Pricing**: Define your asset price in ICP tokens
4. **List for Sale**: Make your assets available in the marketplace

### For Asset Buyers
1. **Browse Marketplace**: Explore available VR assets by category
2. **Preview in VR**: Use the immersive VR viewer to experience assets
3. **Purchase Assets**: Buy assets using ICP tokens
4. **Manage Collection**: View and manage your owned assets

### Supported VR File Formats
- **GLB** (recommended): Binary glTF format
- **GLTF**: Text-based glTF format  
- **OBJ**: Wavefront OBJ format
- **FBX**: Autodesk FBX format

## 🔐 Security Features

- **Decentralized Authentication**: No central authentication server
- **Smart Contract Ownership**: Asset ownership verified on-chain
- **Secure Transactions**: All payments handled by Internet Computer
- **Principal-based Identity**: Each user identified by their IC principal

## 🌐 Deployment to IC Mainnet

### 1. Configure for Mainnet
```bash
# Add cycles to your wallet (requires real ICP)
dfx wallet --network ic balance

# Deploy to mainnet
dfx deploy --network ic
```

### 2. Update Frontend for Production
Update the frontend environment variables to use mainnet canister IDs and set production URLs.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Join the [Internet Computer Developer Community](https://forum.dfinity.org/)
- Check the [Internet Computer Documentation](https://internetcomputer.org/docs/)

## 🙏 Acknowledgments

- [Internet Computer](https://internetcomputer.org/) for the blockchain infrastructure
- [A-Frame](https://aframe.io/) for VR/AR experiences
- [React](https://reactjs.org/) for the frontend framework
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Rust](https://www.rust-lang.org/) for backend canister development

---

**Built with ❤️ on the Internet Computer**
