import * as anchor from "@coral-xyz/anchor";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import * as fs from "fs";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const connection = provider.connection;
  const admin = provider.wallet;

  console.log("💰 Checking Token Balances...");
  console.log("User:", admin.publicKey.toString());

  // Load pool info
  const poolInfo = JSON.parse(fs.readFileSync("pool-info.json", "utf8"));
  console.log("\n📊 Pool Info:");
  console.log("Token X Mint:", poolInfo.mintX);
  console.log("Token Y Mint:", poolInfo.mintY);
  console.log("LP Mint:", poolInfo.lpMint);

  // Get user token accounts
  const userAtaX = await getOrCreateAssociatedTokenAccount(
    connection,
    admin.payer,
    new anchor.web3.PublicKey(poolInfo.mintX),
    admin.publicKey
  );

  const userAtaY = await getOrCreateAssociatedTokenAccount(
    connection,
    admin.payer,
    new anchor.web3.PublicKey(poolInfo.mintY),
    admin.publicKey
  );

  const userLpAta = await getOrCreateAssociatedTokenAccount(
    connection,
    admin.payer,
    new anchor.web3.PublicKey(poolInfo.lpMint),
    admin.publicKey
  );

  // Check balances
  console.log("\n🔍 Current Token Balances:");
  const userXBalance = await getAccount(connection, userAtaX.address);
  const userYBalance = await getAccount(connection, userAtaY.address);
  const userLpBalance = await getAccount(connection, userLpAta.address);

  console.log("Token X Balance:", userXBalance.amount.toString());
  console.log("Token Y Balance:", userYBalance.amount.toString());
  console.log("LP Token Balance:", userLpBalance.amount.toString());

  // Calculate required amounts for deposit
  const requiredX = 500_000; // 0.5 token X
  const requiredY = 500_000; // 0.5 token Y

  console.log("\n📋 Required for Liquidity Deposit:");
  console.log("Required Token X:", requiredX.toString());
  console.log("Required Token Y:", requiredY.toString());

  console.log("\n📊 Status:");
  if (userXBalance.amount >= requiredX) {
    console.log("✅ Token X: Sufficient");
  } else {
    console.log(
      "❌ Token X: Insufficient (need",
      requiredX - Number(userXBalance.amount),
      "more)"
    );
  }

  if (userYBalance.amount >= requiredY) {
    console.log("✅ Token Y: Sufficient");
  } else {
    console.log(
      "❌ Token Y: Insufficient (need",
      requiredY - Number(userYBalance.amount),
      "more)"
    );
  }

  console.log("\n💡 To get tokens on devnet:");
  console.log("1. Use Solana CLI: solana airdrop 2 <your-wallet> --url devnet");
  console.log("2. Or use a faucet service for devnet tokens");
  console.log("3. Make sure you have SOL for transaction fees");
}

main().catch(console.error);
