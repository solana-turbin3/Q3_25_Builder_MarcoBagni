import * as anchor from "@coral-xyz/anchor";
import { homedir } from "os";
import { readFileSync } from "fs";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
} from "@solana/spl-token";

async function main() {
  // Set environment variables if not already set
  if (!process.env.ANCHOR_PROVIDER_URL) {
    process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
  }
  if (!process.env.ANCHOR_WALLET) {
    process.env.ANCHOR_WALLET = homedir() + "/.config/solana/d1x.json";
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.amm;
  const connection = provider.connection;

  console.log("🚀 AMM Program Information");
  console.log("==========================");
  console.log("Program ID:", program.programId.toString());
  console.log("Cluster:", provider.connection.rpcEndpoint);
  console.log("Wallet:", provider.wallet.publicKey.toString());

  // Load pool info
  try {
    const poolInfo = JSON.parse(readFileSync("pool-info.json", "utf8"));

    console.log("\n📊 Pool Information");
    console.log("===================");
    console.log("Config PDA:", poolInfo.configPda);
    console.log("LP Mint:", poolInfo.lpMint);
    console.log("Vault X:", poolInfo.vaultX);
    console.log("Vault Y:", poolInfo.vaultY);
    console.log("Token X Mint:", poolInfo.mintX);
    console.log("Token Y Mint:", poolInfo.mintY);
    console.log("Seed:", poolInfo.seed);
    console.log("Fee:", poolInfo.fee, "basis points");
    console.log("Created:", poolInfo.createdAt);

    // Get current pool balances
    const vaultXBalance = await getAccount(
      connection,
      new anchor.web3.PublicKey(poolInfo.vaultX)
    );
    const vaultYBalance = await getAccount(
      connection,
      new anchor.web3.PublicKey(poolInfo.vaultY)
    );
    const lpMintInfo = await getMint(
      connection,
      new anchor.web3.PublicKey(poolInfo.lpMint)
    );

    console.log("\n💰 Pool Balances");
    console.log("================");
    console.log(
      `Vault X (Token A): ${(Number(vaultXBalance.amount) / 1_000_000).toFixed(
        6
      )}`
    );
    console.log(
      `Vault Y (Token B): ${(Number(vaultYBalance.amount) / 1_000_000).toFixed(
        6
      )}`
    );
    console.log(
      `LP Token Supply: ${(Number(lpMintInfo.supply) / 1_000_000).toFixed(6)}`
    );

    // Calculate current ratio
    const currentRatio =
      Number(vaultYBalance.amount) / Number(vaultXBalance.amount);
    console.log(
      `\n⚖️ Current Ratio: 1 Token A = ${currentRatio.toFixed(6)} Token B`
    );

    // Get user balances
    const userAtaX = await getOrCreateAssociatedTokenAccount(
      connection,
      provider.wallet.payer,
      new anchor.web3.PublicKey(poolInfo.mintX),
      provider.wallet.publicKey
    );

    const userAtaY = await getOrCreateAssociatedTokenAccount(
      connection,
      provider.wallet.payer,
      new anchor.web3.PublicKey(poolInfo.mintY),
      provider.wallet.publicKey
    );

    const userLpAta = await getOrCreateAssociatedTokenAccount(
      connection,
      provider.wallet.payer,
      new anchor.web3.PublicKey(poolInfo.lpMint),
      provider.wallet.publicKey
    );

    const userXBalance = await getAccount(connection, userAtaX.address);
    const userYBalance = await getAccount(connection, userAtaY.address);
    const userLpBalance = await getAccount(connection, userLpAta.address);

    console.log("\n👤 Your Balances");
    console.log("================");
    console.log(
      `Token A: ${(Number(userXBalance.amount) / 1_000_000).toFixed(6)}`
    );
    console.log(
      `Token B: ${(Number(userYBalance.amount) / 1_000_000).toFixed(6)}`
    );
    console.log(
      `LP Tokens: ${(Number(userLpBalance.amount) / 1_000_000).toFixed(6)}`
    );

    console.log("\n✅ Pool is active and ready for trading!");
    console.log("\nAvailable commands:");
    console.log("• npx ts-node scripts/deposit-interactive.ts");
    console.log("• npx ts-node scripts/swap-tokens.ts");
    console.log("• npx ts-node scripts/withdraw-liquidity.ts");
    console.log("• npx ts-node scripts/check-balances.ts");
  } catch (error) {
    console.log("❌ Error loading pool info:", error.message);
    console.log(
      "Make sure pool-info.json exists and contains valid pool data."
    );
  }
}

main().catch(console.error);
