# Solana Starter - Marco Bagni @ Turbin3 Q3 2025

## 🔍 Solana Cheatsheet

### 🔄 Solana Frameworks:

- **@solana/web3.js**: Low-level Solana JavaScript API
- **@coral-xyz/anchor**: Framework for Solana program development
- **@gumdrop/gill**: Gill framework for Solana development
- **@solana/wallet-adapter**: Wallet connection utilities
- **@solana/spl-token**: SPL Token utilities and helpers
- **@metaplex-foundation/js**: Legacy Metaplex JavaScript SDK
- **@metaplex-foundation/umi**: Modern, type-safe Metaplex framework (best for NFTs)

### 📋 Token Program Addresses:

- **SPL_TOKEN**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **TOKEN_2022**: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`
- **LEGACY_METAPLEX**: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- **CORE**: `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`
- **ATA_PROGRAM**: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`
- **MEMO**: `MemoSq4gqABAXKb96qnH8TysNcWxSkWC88fxkFDX7k`

### 💡 Program Descriptions:

- **SPL_TOKEN**: Standard Solana token program for fungible tokens
- **TOKEN_2022**: Enhanced token program with additional features (confidential transfers, etc.)
- **LEGACY_METAPLEX**: Original Token Metadata program, still widely used
- **CORE**: New Metaplex program for enhanced NFT functionality
- **ATA_PROGRAM**: Program for creating deterministic token accounts (ATAs)
- **ATA**: Deterministic token account derived from wallet + mint via ATA program
- **TA**: General-purpose token account, can be manual/non-PDA
- **MEMO**: Program for adding memos to transactions

### 🔗 PDA (Program Derived Address) Connections:

- **ATA Program**: Creates deterministic token accounts
- **ATA**: Derived from wallet + mint via ATA program (deterministic)
- **TA**: General token account (can be non-deterministic)
- **Metadata Accounts**: Derived from mint + metadata program
- **Master Editions**: Derived from mint + metadata program + 'edition'
- **Collection Authorities**: Derived from collection + authority program
- **Edition Markers**: Derived from mint + edition + marker

### 📦 UMI Framework Context:

- **UMI (Universal Metaplex Interface)**: Modern framework for Solana development
- Provides type-safe program interactions and simplified APIs
- Handles program registration and address resolution automatically
- **Available programs via UMI (Metaplex ecosystem)**:
  - Associated Token: `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`
  - Token Metadata: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- **Note**: UMI wraps Metaplex programs, but SPL Token operations use web3.js + spl-token directly

### 🔍 Key Differences:

- **SPL_TOKEN vs TOKEN_2022**: Standard vs enhanced token features
- **LEGACY_METAPLEX vs CORE**: Original vs new NFT metadata handling
- **UMI vs Web3.js**: High-level vs low-level programming
- **ATA vs TA**: Deterministic vs general token accounts
- **Web3.js**: Current standard for SPL token operations
- **Gill vs Kit vs Web3.js**: Alternative vs official vs standard approaches

### 🚀 Framework Use Cases:

- **SPL Token**: Best for basic token operations, fungible tokens
- **Web3.js**: Best for learning, low-level control, SPL token operations
- **Gill**: Best for specific use cases, alternative approach
- **UMI**: Best for NFT development, Metaplex ecosystem, type safety
- **Anchor**: Best for custom program development, complex DeFi

## 📁 Project Structure

```
Q3_25_MarcoBagni/
├── rs/                    # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── programs/
├── ts/                    # TypeScript frontend
│   ├── cluster1/         # Devnet scripts
│   │   ├── nft_mint2.ts  # Token ecosystem overview
│   │   ├── programs/
│   │   └── wallet/
│   ├── prereqs/          # Prerequisites
│   └── tools/            # Utility tools
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- Solana CLI tools

### Installation

```bash
# Install dependencies
npm install

# Build Rust programs
cd rs && cargo build

# Run TypeScript scripts
cd ts/cluster1 && npm run dev
```

## 🎯 Key Features

- **Comprehensive Token Overview**: Complete Solana token ecosystem documentation
- **Framework Comparison**: Detailed analysis of available Solana frameworks
- **Program Addresses**: All major token program addresses with descriptions
- **PDA Understanding**: Clear explanation of Program Derived Addresses
- **UMI Integration**: Modern Metaplex framework usage examples

## 📚 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Metaplex Documentation](https://docs.metaplex.com/)
- [UMI Framework](https://docs.metaplex.com/umi/)
- [SPL Token Program](https://spl.solana.com/token)

## 🤝 Contributing

This project is part of Turbin3 Q3 2025 curriculum. For questions or contributions, please refer to the course guidelines.

---

**Author**: Marco Bagni  
**Course**: Turbin3 Q3 2025  
**Focus**: Solana Development & Token Ecosystem
