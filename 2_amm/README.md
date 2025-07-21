# 💧 Solana AMM (Automated Market Maker)

A decentralized, constant product AMM (x\*y=k) built on Solana using the Anchor framework. This program enables anyone to create and provide liquidity pools for **any SPL token pair**—with LP tokens, swaps, and permissionless deposits/withdrawals.

---

## 📋 How It Looks

Pool & User Information<br>
<img width="560" height="642" alt="amm-image-1" src="https://github.com/user-attachments/assets/360c7635-6fc1-4746-a56d-0f5160a04b6d" />

Withdrawal<br>
<img width="558" height="603" alt="amm-image-2" src="https://github.com/user-attachments/assets/0b0eab99-5be5-441f-95ca-920aeac8b5ce" />

Swap<br>
<img width="551" height="714" alt="amm-image-3" src="https://github.com/user-attachments/assets/e36acabc-6e2c-4bde-82ec-97fe0456ba35" />

## 📋 How It Works

A classic constant product AMM (like Uniswap v2) for Solana:

```
┌───────────────┐      ┌────────────────────┐      ┌───────────────┐
    👤 USER             🔐 AMM PROGRAM             👤 USER

 • Deposit X/Y   ◄──►   • Holds vaults      ◄──►   • Swap X for Y
 • Get LP tokens         • Mints LP tokens         • Add/remove liquidity
 • Withdraw anytime      • Enforces x*y=k         • Earns fees
└───────────────┘      └────────────────────┘      └───────────────┘
                             │
                             │
                  ┌────────────────────────┐
                      💧 VAULTS (PDAs)
                      • Hold Token X & Y
                      • Program owns
                      • Secure PDA
                  └────────────────────────┘
```

### 🔐 PDA Security (Program Derived Addresses)

- **Config**: `[b"config", seed]` → Unique per pool
- **Vaults**: `[b"vault", config, mint]` → Hold tokens
- **LP Mint**: `[b"lp", config]` → Mints LP tokens

### The AMM Lifecycle

1. **Initialize Pool**

   - Admin creates a new pool for any two SPL tokens
   - Vaults and LP mint are created as PDAs
   - Initial liquidity sets the price ratio

2. **Deposit Liquidity**

   - Anyone can deposit tokens in the correct ratio
   - Receives LP tokens representing their share

3. **Swap**

   - Anyone can swap between the two tokens
   - Constant product formula (x\*y=k) determines price
   - Fee is taken and added to the pool

4. **Withdraw Liquidity**
   - Burn LP tokens to withdraw proportional share

---

## 🚀 Features

- **Any SPL Token Pair**: Create pools for any two SPL tokens
- **LP Tokens**: Earn LP tokens as proof of liquidity
- **Constant Product Curve**: x\*y=k pricing, like Uniswap v2
- **Permissionless**: Anyone can deposit, withdraw, or swap
- **PDA Security**: All vaults and mints are program-owned
- **Fee Support**: Configurable trading fee (basis points)
- **TypeScript Integration**: Full TypeScript/Anchor client support

---

## 📁 Project Structure

```
amm/
├── programs/amm/           # Solana program (Rust)
│   └── src/
│       ├── lib.rs          # Main program logic
│       ├── instructions/   # Program instructions
│       └── states/         # Account structures
├── scripts/                # TypeScript CLI scripts
│   ├── initialize-pool.ts  # Create a new pool
│   ├── deposit-interactive.ts # Interactive deposit
│   ├── deposit-simple.ts   # Example deposit
│   ├── swap-tokens.ts      # Swap tokens
│   ├── withdraw-liquidity.ts # Withdraw liquidity
│   └── check-balances.ts   # Check user/pool balances
├── tests/                  # Test files
├── migrations/             # Deployment scripts
└── Anchor.toml             # Anchor configuration
```

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://book.anchor-lang.com/getting-started/installation.html)

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Build the Program

```bash
anchor build
```

### 3. Deploy to Devnet

```bash
anchor deploy
```

### 4. Initialize a Pool

```bash
yarn initialize-pool
```

### 5. Deposit Liquidity (Interactive)

```bash
yarn deposit-interactive
```

### 6. Swap Tokens

```bash
yarn swap-tokens
```

### 7. Withdraw Liquidity

```bash
yarn withdraw-liquidity
```

### 8. Check Balances

```bash
yarn check-balances
```

---

## 🧪 Testing

Run the test suite:

```bash
yarn test
```

---

## 🏗️ Architecture

### Core Components

1. **Config**: Stores pool parameters, mints, fee, and authority
2. **Vaults**: Hold all deposited Token X and Token Y (PDAs)
3. **LP Mint**: Mints LP tokens to liquidity providers (PDA)
4. **Deposit**: Add liquidity, mint LP tokens
5. **Withdraw**: Burn LP tokens, withdraw proportional share
6. **Swap**: Trade between tokens using x\*y=k

### Security Features

- **PDA-based Accounts**: All vaults and mints are program-owned
- **Custom Token Support**: Works with any SPL tokens (Token X ≠ Token Y)
- **Signer Validation**: Only authorized parties can execute admin ops
- **Transfer Safety**: Uses `transfer_checked` for decimal validation
- **Slippage Protection**: Deposits/withdrawals revert if amounts don't match pool ratio

---

## 📝 Usage Examples

### Initialize a Pool

```typescript
await program.methods
  .initialize(seed, fee, null)
  .accounts({
    admin: admin.publicKey,
    mintX,
    mintY,
    config: configPda,
    mintLp: lpMint,
    vaultX,
    vaultY,
    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();
```

### Deposit Liquidity (Interactive)

```typescript
// Run the CLI and follow prompts
yarn deposit-interactive
```

### Swap Tokens

```typescript
await program.methods
  .swap(amountIn, minAmountOut)
  .accounts({
    user: user.publicKey,
    mintX,
    mintY,
    config: configPda,
    vaultX,
    vaultY,
    userAtaX,
    userAtaY,
    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();
```

### Withdraw Liquidity

```typescript
await program.methods
  .withdraw(lpAmount)
  .accounts({
    user: user.publicKey,
    mintX,
    mintY,
    config: configPda,
    mintLp: lpMint,
    vaultX,
    vaultY,
    userAtaX,
    userAtaY,
    userAtaLp,
    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();
```

---

## 📃 Scripts Overview

| Script                   | Purpose                       | Usage                      |
| ------------------------ | ----------------------------- | -------------------------- |
| `initialize-pool.ts`     | Create a new AMM pool         | `yarn initialize-pool`     |
| `deposit-interactive.ts` | Interactive liquidity deposit | `yarn deposit-interactive` |
| `deposit-simple.ts`      | Example deposit               | `yarn deposit-simple`      |
| `swap-tokens.ts`         | Swap tokens in the pool       | `yarn swap-tokens`         |
| `withdraw-liquidity.ts`  | Withdraw liquidity            | `yarn withdraw-liquidity`  |
| `check-balances.ts`      | Check user and pool balances  | `yarn check-balances`      |

---

## 🎯 Custom Token Implementation

**The AMM supports any SPL tokens!**

### 1. Define Your Tokens

```typescript
const MINT_X_ADDRESS = "YourTokenXMintAddress";
const MINT_Y_ADDRESS = "YourTokenYMintAddress";
```

### 2. Initialize Pool

```typescript
const mintX = new PublicKey(MINT_X_ADDRESS);
const mintY = new PublicKey(MINT_Y_ADDRESS);
await program.methods
  .initialize(seed, fee, null)
  .accounts({
    mintX,
    mintY,
    // ... other accounts
  })
  .rpc();
```

### 3. Deposit Liquidity

```typescript
// Use the CLI or call deposit directly
await program.methods
  .deposit(lpAmount, maxX, maxY)
  .accounts({
    mintX,
    mintY,
    // ... other accounts
  })
  .rpc();
```

---

## 📊 Program State

```rust
pub struct Config {
    pub seed: u64,           // Unique pool identifier
    pub authority: Option<Pubkey>, // Optional admin
    pub mint_x: Pubkey,      // Token X mint
    pub mint_y: Pubkey,      // Token Y mint
    pub fee: u16,            // Fee in basis points
    pub locked: bool,        // Pool lock flag
    pub config_bump: u8,     // PDA bump
    pub lp_bump: u8,         // LP mint bump
}
```

---

## 🚀 Deployment

### Devnet

- **Program ID**: _Set in Anchor.toml_

### Build & Deploy

```bash
anchor build
anchor deploy
```

---

## ⚠️ Important Notes

- **Custom Tokens**: Token X and Token Y can be any SPL tokens
- **Wallet Configuration**: Ensure your Solana wallet is properly configured
- **Network**: Currently configured for Devnet
- **Gas Fees**: All transactions require SOL for gas fees
- **Security**: Only authorized parties can execute admin operations

---

## 🤝 Contributing

Thanks to colleague [Priyanash Patel](https://github.com/priyanshpatel18/Q3_25_Builder_priyanshpatel18) for the rust side
