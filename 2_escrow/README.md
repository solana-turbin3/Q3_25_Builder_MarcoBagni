# 🔄 Solana Escrow Program

A secure, decentralized escrow system built on Solana using the Anchor framework. This program enables trustless token swaps between two parties with **custom token support** - you can use any SPL tokens as Token A and Token B!

## 📋 How It Works

A digital escrow service that holds token A safely until Taker sends token B to Maker.

### 🎭 The Players

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
      👤 MAKER                         🔐 PROGRAM                        👤 TAKER

   • Creates escrow        ◄──►      • Controls            ◄──►     • Provides Token B
   • Sets trade terms                  everything                   • Receives Token A
   • Deposits Token A                • Validates                    • Completes trade
   • Can refund                      • Enforces
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                            │
                                            │
                                ┌────────────────────────┐
                                    🔒 ESCROW VAULT

                                     • Holds Token A
                                     • Program owns
                                     • Secure PDA
                                └────────────────────────┘
```

### 🔐 PDA Security (Program Derived Addresses)

- **Escrow State**: `[b"escrow", maker_wallet, seed]` → Unique per escrow
- **Escrow Vault**: `[b"vault", escrow_state]` → Holds deposited Token A

### The Process & State Changes:

1. **Make Escrow** (Maker creates trade):

   - Maker deposits Token A into vault
   - Program creates escrow state (stores trade terms)
   - **State**: Maker wallet → Escrow vault (Token A amount)

2. **Take Trade** (Taker completes swap):

   - Taker sends Token B to maker
   - Program transfers Token A from vault to taker
   - Program closes vault and escrow accounts
   - **State**: Taker wallet → Maker wallet (Token B) + Vault → Taker wallet (Token A)

3. **Refund** (Maker cancels trade):

   - Program returns all Token A to maker
   - Program closes vault and escrow accounts
   - **State**: Vault → Maker wallet (all Token A)

**Security**: Only the maker can refund, and only when both parties agree does the trade complete atomically!

## 🚀 Features

- **Custom Token Support**: Use any SPL tokens - Token A and Token B can be completely different tokens
- **Trustless Trading**: No intermediaries required for secure token swaps
- **Atomic Swaps**: Either both parties get their tokens or the transaction fails
- **PDA-based Security**: Uses Program Derived Addresses for vault authority
- **Rent Optimization**: Automatically closes accounts and refunds rent
- **TypeScript Integration**: Full TypeScript support with Anchor client

## 📁 Project Structure

```
2_escrow/
├── programs/escrow/         # Solana program (Rust)
│   └── src/
│       ├── lib.rs          # Main program logic
│       ├── instructions/    # Program instructions
│       └── states/         # Account structures
├── scripts/                 # TypeScript interaction scripts
│   ├── make.ts             # Create escrow
│   └── take.ts             # Complete trade
├── tests/                  # Test files
├── migrations/             # Deployment scripts
└── Anchor.toml            # Anchor configuration
```

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://book.anchor-lang.com/getting-started/installation.html)

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

### 4. Create an Escrow

```bash
yarn make
```

### 5. Complete a Trade

```bash
yarn take
```

### 6. Run Tests

```bash
yarn test
```

## 🧪 Testing

Run the test suite:

```bash
yarn test
```

## 🏗️ Architecture

### Core Components

1. **Escrow**: Stores trade parameters and metadata
2. **Make**: Creates escrow and deposits Token A
3. **Take**: Completes trade by swapping tokens
4. **Refund**: Allows maker to reclaim tokens

### Security Features

- **PDA-based Accounts**: All escrows use Program Derived Addresses
- **Custom Token Support**: Works with any SPL tokens (Token A ≠ Token B)
- **Signer Validation**: Only authorized parties can execute operations
- **Transfer Safety**: Uses `transfer_checked` for decimal validation

## 📝 Usage Examples

### Create an Escrow

```typescript
const SEED = new anchor.BN(1);
const DEPOSIT_AMOUNT = new anchor.BN(500000); // 0.5 Token A
const RECEIVE_AMOUNT = new anchor.BN(1000000); // 1 Token B

await program.methods
  .make(SEED, DEPOSIT_AMOUNT, RECEIVE_AMOUNT)
  .accounts({
    maker: maker.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    // ... other accounts
  })
  .signers([maker])
  .rpc();
```

### Complete a Trade

```typescript
await program.methods
  .take()
  .accounts({
    taker: taker.publicKey,
    maker: maker.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    // ... all required accounts
  })
  .signers([taker])
  .rpc();
```

### Refund Escrow

```typescript
await program.methods
  .refund()
  .accounts({
    maker: maker.publicKey,
    mintA: mintA.publicKey,
    // ... required accounts
  })
  .signers([maker])
  .rpc();
```

## 📃 Scripts Overview

| Script    | Purpose        | Usage       |
| --------- | -------------- | ----------- |
| `make.ts` | Create escrow  | `yarn make` |
| `take.ts` | Complete trade | `yarn take` |
| `test`    | Run test suite | `yarn test` |

## 🎯 Custom Token Implementation

**The escrow program supports any SPL tokens!** Here's how easy it is to use custom tokens:

### 1. Define Your Tokens

```typescript
// Use any SPL token mints
const MINT_A_ADDRESS = "YourTokenAMintAddress";
const MINT_B_ADDRESS = "YourTokenBMintAddress";
```

### 2. Create Escrow

```typescript
// Deposit any amount of Token A
const depositAmount = new anchor.BN(1000000); // 1 Token A
const receiveAmount = new anchor.BN(500000); // 0.5 Token B

const mintA = new PublicKey(MINT_A_ADDRESS);
const mintB = new PublicKey(MINT_B_ADDRESS);

await program.methods
  .make(seed, depositAmount, receiveAmount)
  .accounts({
    mintA: mintA,
    mintB: mintB,
    // ... other accounts
  })
  .rpc();
```

### 3. Complete Trade

```typescript
// Taker provides Token B, receives Token A
await program.methods
  .take()
  .accounts({
    mintA: mintA,
    mintB: mintB,
    // ... other accounts
  })
  .rpc();
```

**That's it!** The program automatically handles different token decimals, creates associated token accounts, and ensures atomic swaps.

## 📊 Program State

```rust
pub struct Escrow {
    pub seed: u64,           // Unique identifier
    pub maker: Pubkey,       // Escrow creator
    pub mint_a: Pubkey,      // Deposited token mint
    pub mint_b: Pubkey,      // Expected token mint
    pub receive: u64,        // Expected Token B amount
    pub bump: u8,            // PDA bump seed
}
```

## 🚀 Deployment

### Devnet

- **Program ID**: `DzHecQ3KDv5q9jjpEYhAzgjGuwXNkzwuiZKXt5LKVkym`

### Build & Deploy

```bash
anchor build
anchor deploy
```

## ⚠️ Important Notes

- **Custom Tokens**: Token A and Token B can be completely different SPL tokens
- **Wallet Configuration**: Ensure your Solana wallet is properly configured
- **Network**: Currently configured for Devnet
- **Gas Fees**: All transactions require SOL for gas fees
- **Security**: Only authorized parties can execute operations

## 🤝 Contributing

Thanks to colleague [Priyanash Patel](https://github.com/priyanshpatel18/Q3_25_Builder_priyanshpatel18) for the rust side
