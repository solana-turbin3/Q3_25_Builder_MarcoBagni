# 🎯 Solana NFT Marketplace

A decentralized NFT marketplace built on Solana using the Anchor framework. This marketplace enables users to **list, purchase, and manage NFTs** with secure escrow, fee collection, and program-derived address (PDA) management.

---

## 📋 How It Looks

Admin & User View<br>
<img width="100%" alt="marketplace" src="https://github.com/user-attachments/assets/ca378c27-e03c-4413-8928-d275252f4aac" />

## 📋 How It Works

A secure NFT marketplace with escrow and fee management:

```
┌─────────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
          👤 ADMIN                        🔐 MARKETPLACE                     👥 USERS

 • Initialize marketplace       ◄──►    • Manages listings      ◄──►     • View marketplace
 • Update fee percentage                • Handles escrow                 • Purchase NFTs
 • View marketplace state               • Collects fees                  • List NFTs
 • Delist NFTs                          • Secure PDA storage             • Delist NFTs
└─────────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                 │
                                                 │
                                     ┌────────────────────────┐
                                         💎 PDAs (Program)

                                        • Marketplace state
                                        • Treasury account
                                        • Listing accounts
                                        • NFT vaults
                                     └────────────────────────┘
```

### 🔐 PDA Security

- **Marketplace**: `[b"marketplace"]` → Global marketplace state
- **Treasury**: `[b"treasury", marketplace]` → Fee collection account
- **Listing**: `[b"listing", marketplace, seller, nft_mint]` → Individual NFT listings
- **Vault**: `[b"vault", listing]` → Hold listed NFTs in escrow

### The Marketplace Lifecycle

1. **Initialize Marketplace** - Admin sets up marketplace with fee percentage
2. **List NFT** - User lists NFT for sale, NFT moved to escrow vault
3. **Purchase NFT** - Buyer purchases NFT, fees collected to treasury
4. **Delist NFT** - Seller can delist unsold NFTs back to their wallet

---

## 🚀 Features

- **Secure Escrow**: NFTs held in program-owned vaults during listings
- **Fee Management**: Configurable marketplace fees (default: 1%)
- **PDA Security**: All accounts use program-derived addresses
- **TypeScript Integration**: Full TypeScript/Anchor client support
- **Admin Controls**: Fee updates and marketplace management

---

## 📁 Project Structure

```
3_marketplace/
├── programs/marketplace/     # Solana program (Rust)
│   ├── src/
│   │   ├── lib.rs           # Main program logic
│   │   ├── instructions/    # Instruction handlers
│   │   └── states/         # Account state definitions
├── scripts/                 # TypeScript CLI scripts
│   ├── app-admin.ts        # Admin interface
│   └── app-user.ts         # User interface
├── tests/                  # Test files
├── config.json             # Configuration
└── Anchor.toml             # Anchor configuration
```

---

## ⚡ Quick Start

### 1. Install & Build

```bash
yarn install
anchor build
```

### 2. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 3. Configure Wallet

Create `config.json` (config_example.json):

```json
{
  "ADMIN_WALLET": "YOUR_ADMIN_WALLET.json",
  "USER_1_WALLET": "YOUR_USER_1_WALLET.json",
  "USER_2_WALLET": "YOUR_USER_2_WALLET.json"
}
```

### 4. Use the Program

```bash
# Admin interface
yarn admin

# User interface
yarn user
```

---

## 📃 Scripts Overview

| Script         | Purpose         | Usage        |
| -------------- | --------------- | ------------ |
| `app-admin.ts` | Admin interface | `yarn admin` |
| `app-user.ts`  | User interface  | `yarn user`  |

---

## 🚀 Deployment

### Devnet

- **Program ID**: `3bs4EeMMsbbtxK4QybwmQ7dDoR3q9cjuBRcVWjS9MYTm`

### Build & Deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## 🤝 Contributing

Thanks to colleague [Priyanash Patel](https://github.com/priyanshpatel18/Q3_25_Builder_priyanshpatel18) for the rust side
