# 🏦 Solana Vault Program

A simple yet secure vault program built on Solana using the Anchor framework. This program allows users to deposit and withdraw SOL tokens with proper account validation and security measures.

## 🚀 Features

- **Secure Deposits**: Users can deposit SOL into their personal vault
- **Safe Withdrawals**: Users can withdraw SOL from their vault with proper authorization
- **PDA-based Security**: Uses Program Derived Addresses (PDAs) for secure account management
- **Rent Exemption**: Automatically handles rent exemption for vault accounts
- **TypeScript Integration**: Full TypeScript support with Anchor client

## 📋 How It Works

Think of this like a digital bank vault system with advanced security. Here's what happens:

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
         👤 YOU                          🔐 PROGRAM                         🏦 VAULT

      • Your wallet        ◄──►       • Controls             ◄──►      • Holds your
      • Your SOL                        everything                       deposited SOL
      • Your keys                     • Validates                      • Program owns
                                      • Enforces                       • Secure PDA
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                              │
                                              │
                                 ┌─────────────────────────┐
                                       📊 VAULT STATE

                                      • Tracks info
                                      • Security codes
                                      • Bump seeds
                                 └─────────────────────────┘
```

### 🔐 PDA Security (Program Derived Addresses)

- **Vault State**: `[b"state", your_wallet]` → Unique per user
- **Vault Account**: `[b"vault", vault_state]` → Unique per vault

### The Process & State Changes:

1. **Initialize Vault**:

   - Creates VaultState account (stores bump seeds)
   - Creates Vault account (holds SOL)
   - Transfers rent exemption to vault
   - **State**: User wallet → Vault account (rent amount)

2. **Deposit SOL**:

   - Transfers SOL from user wallet to vault
   - **State**: User wallet → Vault account (deposit amount)

3. **Withdraw SOL**:
   - Program validates you own the vault
   - Transfers SOL from vault to your wallet
   - **State**: Vault account → User wallet (withdraw amount)

**Security**: Only you can withdraw - the program checks your signature and vault ownership automatically!

## 📁 Project Structure

```
2_vault/
├── programs/vault/          # Solana program (Rust)
│   └── src/lib.rs          # Main program logic
├── scripts/                 # TypeScript interaction scripts
│   ├── init-vault.ts       # Initialize user vault
│   ├── deposit.ts          # Deposit SOL to vault
│   ├── withdraw.ts         # Withdraw SOL from vault
│   └── list-vaults.ts      # List vault information
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

### 4. Initialize Your Vault

```bash
yarn init
```

### 5. Deposit SOL

```bash
yarn deposit
```

### 6. Withdraw SOL

```bash
yarn withdraw
```

### 7. Check Vault Status

```bash
yarn list-vaults
```

## 🧪 Testing

Run the test suite:

```bash
yarn test
```

## ️ Architecture

### Core Components

1. **VaultState**: Stores vault metadata and bump seeds
2. **Initialize**: Creates a new vault for a user
3. **Deposit**: Transfers SOL from user to vault
4. **Withdraw**: Transfers SOL from vault to user

### Security Features

- **PDA-based Accounts**: All vaults use Program Derived Addresses
- **Signer Validation**: Only vault owners can withdraw funds
- **Rent Exemption**: Vaults are rent-exempt by design
- **Bump Seed Storage**: Secure bump seed management

## 📝 Usage Examples

### Initialize a Vault

```typescript
const tx = await program.methods.initialize().rpc();
```

### Deposit SOL

```typescript
const amount = new anchor.BN(1000000000); // 1 SOL
const tx = await program.methods.deposit(amount).rpc();
```

### Withdraw SOL

```typescript
const amount = new anchor.BN(500000000); // 0.5 SOL
const tx = await program.methods.withdraw(amount).rpc();
```

## �� Scripts Overview

| Script           | Purpose                 | Usage              |
| ---------------- | ----------------------- | ------------------ |
| `init-vault.ts`  | Initialize user vault   | `yarn init`        |
| `deposit.ts`     | Deposit SOL to vault    | `yarn deposit`     |
| `withdraw.ts`    | Withdraw SOL from vault | `yarn withdraw`    |
| `list-vaults.ts` | Check vault status      | `yarn list-vaults` |

## ⚠️ Important Notes

- **Wallet Configuration**: Ensure your Solana wallet is properly configured
- **Network**: Currently configured for Devnet
- **Gas Fees**: All transactions require SOL for gas fees
- **Security**: Only vault owners can withdraw funds

## 🤝 Contributing

Thanks to colleague [Priyanash Patel](https://github.com/priyanshpatel18/Q3_25_Builder_priyanshpatel18) for the rust side

---

**Built with ❤️ using Anchor Framework**
