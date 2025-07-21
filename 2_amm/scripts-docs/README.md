# AMM Testing Scripts

This folder contains TypeScript scripts to test the AMM protocol functionality.

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Build the program:**

```bash
anchor build
```

3. **Deploy to devnet:**

```bash
anchor deploy --provider.cluster devnet
```

4. **Set environment variables for devnet:**

```bash
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/d1x.json  # or your wallet path
```

## Using Custom Token Mints

To initialize a pool with your own tokens (e.g., `ADDRESS_A` and `ADDRESS_B`):

1. **Edit `scripts/initialize-pool.ts`:**

   - Find the section:
     ```ts
     // === USER: SET YOUR TOKEN MINT ADDRESSES HERE ===
     const ADDRESS_A = "REPLACE_WITH_TOKEN_A_MINT";
     const ADDRESS_B = "REPLACE_WITH_TOKEN_B_MINT";
     // ===============================================
     const mintX = new anchor.web3.PublicKey(ADDRESS_A);
     const mintY = new anchor.web3.PublicKey(ADDRESS_B);
     ```
   - Replace `REPLACE_WITH_TOKEN_A_MINT` and `REPLACE_WITH_TOKEN_B_MINT` with your actual token mint addresses.
   - **Remove or ignore any `createMint` logic**—it is not needed for existing tokens.

2. **Set initial liquidity amounts:**

   - In the same file, set:
     ```ts
     const TOKEN_A_AMOUNT = 0.1; // 0.1 tokens of A
     const TOKEN_B_AMOUNT = 11; // 11 tokens of B
     ```
   - These values will be used to establish the initial price ratio.

3. **Run the script:**
   ```bash
   npx ts-node scripts/initialize-pool.ts
   ```

## What is the LP Token Metadata?

After pool creation, the script prints LP token metadata:

- **Mint address:** The PDA for the LP token mint (see pool info output)
- **Decimals:** 6 (default)
- **Total supply:** Increases as users deposit liquidity
- **Mint authority:** The pool config PDA
- **Freeze authority:** (usually none)
- **Name/symbol:** Not set on-chain unless you register it with the SPL Token Metadata program (optional, not done by default)

You can fetch LP token metadata using the SPL Token program:

```ts
import { getMint } from "@solana/spl-token";
const lpMintInfo = await getMint(
  connection,
  new anchor.web3.PublicKey(poolInfo.lpMint)
);
console.log("LP Mint:", poolInfo.lpMint);
console.log("Decimals:", lpMintInfo.decimals);
console.log("Supply:", lpMintInfo.supply.toString());
```

## Available Scripts

- `initialize-pool.ts` — Initialize pool with custom tokens and amounts
- `deposit-liquidity.ts` — Deposit liquidity into pool
- `swap-tokens.ts` — Swap tokens in the pool
- `withdraw-liquidity.ts` — Withdraw liquidity from pool
- `check-balances.ts` — Check all balances and pool state
- `show-program-info.ts` — Show program information

## Example Usage

```bash
npx ts-node scripts/initialize-pool.ts
npx ts-node scripts/check-balances.ts
```

## Pool Information

After running `initialize-pool.ts`, a `pool-info.json` file is created with:

```json
{
  "configPda": "Config PDA address",
  "lpMint": "LP token mint address",
  "vaultX": "Token X vault address",
  "vaultY": "Token Y vault address",
  "mintX": "Token X mint address",
  "mintY": "Token Y mint address",
  "seed": 42,
  "fee": 30,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Customization

To use your own tokens instead of test tokens:

1. Edit `initialize-pool.ts`
2. Replace `createMint()` calls with your token mint addresses
3. Update token amounts in deposit/swap scripts

## Token Amounts

- **LP Tokens**: 6 decimals (1,000,000 = 1 LP token)
- **Test Tokens**: 6 decimals (1,000,000 = 1 token)
- **Fees**: 30 basis points = 0.3%

## Addresses Generated

- **Config PDA**: `["config", seed.to_le_bytes()]`
- **LP Mint**: `["lp", config_pubkey]`
- **Vault X**: Associated Token Account of config PDA for mint X
- **Vault Y**: Associated Token Account of config PDA for mint Y
