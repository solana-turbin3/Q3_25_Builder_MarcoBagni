# 🎯 Solana NFT Staking Program

A decentralized NFT staking program built on Solana using the Anchor framework. This program enables users to **stake NFTs and earn reward points**—with time-based freeze periods, configurable rewards, and secure vault storage.

---

## 📋 How It Looks

Staking app & Stats<br>
<img width="100%" alt="staking-image-1" src="https://github.com/user-attachments/assets/e20f77c4-0aca-4238-8328-ed73df7e3f2c" />

## 📋 How It Works

A secure NFT staking system with reward points and time-based restrictions:

```
┌─────────────────────────────┐      ┌────────────────────────┐
    👤 USER (6 steps)                    🔐 STAKING PROGRAM

 • Initialize user account      ◄──►    • Holds vaults
 • Stake 1-255 NFTs             ◄──►    • Tracks staking time
 • Wait freeze period           ◄──►    • Enforces freeze period
 • Claim reward tokens          ◄──►    • Manages reward points
 • Unstake after time           ◄──►    • Mints reward tokens
 • View statistics              ◄──►    • Secure PDA storage
└─────────────────────────────┘      └────────────────────────┘
                                                 │
                                                 │
                                     ┌────────────────────────┐
                                         💎 VAULTS (PDAs)
                                        • Hold staked NFTs
                                        • Program owns
                                        • Secure PDA
                                     └────────────────────────┘
```

### 🔐 PDA Security

- **Config**: `[b"config"]` → Global staking configuration
- **User Account**: `[b"user", user.key()]` → User staking data
- **Vault**: `[b"vault", nft_mint]` → Hold staked NFTs
- **Stake Account**: `[b"stake", user.key(), nft_mint]` → Individual stake records
- **Reward Mint**: `[b"rewards", config]` → Reward token mint

### The Staking Lifecycle

1. **Initialize Config** - Admin sets up global staking parameters
2. **Initialize User** - User creates their staking account
3. **Stake NFT** - User stakes 1-255 NFTs, receives reward points
4. **Wait Freeze Period** - NFTs locked for configurable time (default: 24 hours)
5. **Claim Rewards** - Convert earned points to reward tokens
6. **Unstake NFT** - After freeze period expires, NFTs returned to user

---

## 🚀 Features

- **Variable Staking**: Stake 1-255 NFTs in a single transaction
- **Reward Points**: Earn points for staking and unstaking
- **Time-based Freeze**: Configurable lock period (default: 24 hours)
- **PDA Security**: All vaults and accounts are program-owned
- **TypeScript Integration**: Full TypeScript/Anchor client support

---

## 📁 Project Structure

```
3_staking/
├── programs/staking/        # Solana program (Rust)
├── scripts/                 # TypeScript CLI scripts
│   ├── app.ts              # Main staking interface
│   ├── stats.ts            # Account statistics
│   ├── reset-user.ts       # Reset user account
│   └── init.ts             # Initialize config
├── config.json             # Configuration (gitignored)
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
  "wallet": { "path": "~/.config/solana/id.json" },
  "network": { "cluster": "devnet" },
  "nft": { "mintAddress": "YOUR_NFT_MINT_ADDRESS" }
}
```

### 4. Use the Program

```bash
# Stake NFTs (Interactive)
yarn ts-node scripts/app.ts

# View Statistics
yarn ts-node scripts/stats.ts

# Claim Rewards
yarn ts-node scripts/app.ts --claim

# Unstake NFTs
yarn ts-node scripts/app.ts --unstake
```

---

## 📃 Scripts Overview

| Script     | Purpose                | Usage                           |
| ---------- | ---------------------- | ------------------------------- |
| `app.ts`   | Main staking interface | `yarn ts-node scripts/app.ts`   |
| `stats.ts` | Account statistics     | `yarn ts-node scripts/stats.ts` |
| `init.ts`  | Initialize config      | `yarn ts-node scripts/init.ts`  |

---

## 🚀 Deployment

### Devnet

- **Program ID**: `5HKADJFrrocX1PrXdTBxzJEPGZA5xg4EbRMz19aZJmRR`

### Build & Deploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## 🤝 Contributing

Thanks to colleague [Priyanash Patel](https://github.com/priyanshpatel18/Q3_25_Builder_priyanshpatel18) for the rust side
