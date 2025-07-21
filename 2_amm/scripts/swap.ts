import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import * as fs from "fs";
import { homedir } from "os";
import * as readline from "readline";

// Set environment variables if not already set
if (!process.env.ANCHOR_PROVIDER_URL) {
  process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
}
if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = homedir() + "/.config/solana/d1x.json";
}

// Helper function to ask user questions
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.amm;
  const connection = provider.connection;
  const admin = provider.wallet;

  console.log("🔄 Interactive Token Swap");
  console.log("User:", admin.publicKey.toString());

  // Load pool info
  const poolInfo = JSON.parse(fs.readFileSync("pool-info.json", "utf8"));
  console.log("\n📊 Pool Info:");
  console.log("Config PDA:", poolInfo.configPda);
  console.log("Token X:", poolInfo.mintX);
  console.log("Token Y:", poolInfo.mintY);

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

  // Check current balances
  console.log("\n📈 Current Balances:");
  const userXBalance = await getAccount(connection, userAtaX.address);
  const userYBalance = await getAccount(connection, userAtaY.address);
  const vaultXBalance = await getAccount(
    connection,
    new anchor.web3.PublicKey(poolInfo.vaultX)
  );
  const vaultYBalance = await getAccount(
    connection,
    new anchor.web3.PublicKey(poolInfo.vaultY)
  );

  console.log(
    "Your Token A:",
    (Number(userXBalance.amount) / 1_000_000).toFixed(6)
  );
  console.log(
    "Your Token B:",
    (Number(userYBalance.amount) / 1_000_000).toFixed(6)
  );
  console.log(
    "Pool Token X:",
    (Number(vaultXBalance.amount) / 1_000_000).toFixed(6)
  );
  console.log(
    "Pool Token Y:",
    (Number(vaultYBalance.amount) / 1_000_000).toFixed(6)
  );

  // Calculate current price ratio
  const currentRatio =
    Number(vaultYBalance.amount) / Number(vaultXBalance.amount);
  console.log(
    `\n💰 Current Price Ratio: 1 Token X = ${currentRatio.toFixed(6)} Token Y`
  );

  // Interactive swap
  console.log("\n💱 Interactive Swap");
  console.log("-".repeat(30));

  // Ask which token to swap
  const tokenChoice = await askQuestion(
    "Which token do you want to swap? (A/B): "
  );

  if (tokenChoice.toLowerCase() !== "a" && tokenChoice.toLowerCase() !== "b") {
    console.log("❌ Invalid choice. Please enter 'A' or 'B'.");
    return;
  }

  // Ask how much to swap
  const amountStr = await askQuestion(
    `How much Token ${tokenChoice.toUpperCase()} do you want to swap? (e.g., 0.1): `
  );
  const swapAmount = parseFloat(amountStr);

  if (isNaN(swapAmount) || swapAmount <= 0) {
    console.log("❌ Invalid amount. Please enter a positive number.");
    return;
  }

  // Convert to raw units (6 decimals)
  const swapAmountRaw = Math.floor(swapAmount * 1_000_000);

  // Check if user has sufficient balance
  const userBalance =
    tokenChoice.toLowerCase() === "a"
      ? userXBalance.amount
      : userYBalance.amount;
  if (userBalance < BigInt(swapAmountRaw)) {
    console.log(
      `❌ Insufficient balance. You have ${(
        Number(userBalance) / 1_000_000
      ).toFixed(
        6
      )} Token ${tokenChoice.toUpperCase()} but want to swap ${swapAmount.toFixed(
        6
      )}`
    );
    return;
  }

  // Calculate estimated output using constant product formula
  // This is a rough estimate - the actual amount will be calculated by the program
  const isX = tokenChoice.toLowerCase() === "a";
  const inputAmount = swapAmountRaw;
  const feeBps = 30; // 0.3%
  const feeMultiplier = 1 - feeBps / 10000; // 0.997

  let estimatedOutput: number;
  if (isX) {
    // Swapping X for Y
    const xReserve = Number(vaultXBalance.amount);
    const yReserve = Number(vaultYBalance.amount);
    const inputAfterFee = inputAmount * feeMultiplier;
    estimatedOutput = Math.floor(
      (inputAfterFee * yReserve) / (xReserve + inputAfterFee)
    );
  } else {
    // Swapping Y for X
    const xReserve = Number(vaultXBalance.amount);
    const yReserve = Number(vaultYBalance.amount);
    const inputAfterFee = inputAmount * feeMultiplier;
    estimatedOutput = Math.floor(
      (inputAfterFee * xReserve) / (yReserve + inputAfterFee)
    );
  }

  // Set minimum output with 1% slippage tolerance
  const minOutput = Math.floor(estimatedOutput * 0.99);

  console.log(`\n📊 Swap Details:`);
  console.log(
    `Input: ${swapAmount.toFixed(6)} Token ${tokenChoice.toUpperCase()}`
  );
  console.log(
    `Estimated Output: ${(estimatedOutput / 1_000_000).toFixed(6)} Token ${
      isX ? "B" : "A"
    }`
  );
  console.log(
    `Min Output (with 1% slippage): ${(minOutput / 1_000_000).toFixed(
      6
    )} Token ${isX ? "B" : "A"}`
  );
  console.log(`Fee: 0.3% (${feeBps} basis points)`);

  // Ask for confirmation
  const confirm = await askQuestion("\nProceed with swap? (y/n): ");
  if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "") {
    console.log("❌ Swap cancelled.");
    return;
  }

  console.log("\n⚡ Executing swap...");

  // Execute the swap
  const tx = await program.methods
    .swap(isX, new BN(swapAmountRaw), new BN(minOutput))
    .accounts({
      user: admin.publicKey,
      mintX: new anchor.web3.PublicKey(poolInfo.mintX),
      mintY: new anchor.web3.PublicKey(poolInfo.mintY),
      config: new anchor.web3.PublicKey(poolInfo.configPda),
      mintLp: new anchor.web3.PublicKey(poolInfo.lpMint),
      vaultX: new anchor.web3.PublicKey(poolInfo.vaultX),
      vaultY: new anchor.web3.PublicKey(poolInfo.vaultY),
      userAtaX: userAtaX.address,
      userAtaY: userAtaY.address,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Swap completed successfully!");
  console.log(
    "Transaction:",
    `https://explorer.solana.com/tx/${tx}?cluster=devnet`
  );

  // Check balances after swap
  console.log("\n📈 Balances after swap:");
  const userXBalanceAfter = await getAccount(connection, userAtaX.address);
  const userYBalanceAfter = await getAccount(connection, userAtaY.address);
  const vaultXBalanceAfter = await getAccount(
    connection,
    new anchor.web3.PublicKey(poolInfo.vaultX)
  );
  const vaultYBalanceAfter = await getAccount(
    connection,
    new anchor.web3.PublicKey(poolInfo.vaultY)
  );

  console.log(
    "Your Token A:",
    (Number(userXBalanceAfter.amount) / 1_000_000).toFixed(6)
  );
  console.log(
    "Your Token B:",
    (Number(userYBalanceAfter.amount) / 1_000_000).toFixed(6)
  );
  console.log(
    "Pool Token X:",
    (Number(vaultXBalanceAfter.amount) / 1_000_000).toFixed(6)
  );
  console.log(
    "Pool Token Y:",
    (Number(vaultYBalanceAfter.amount) / 1_000_000).toFixed(6)
  );

  // Calculate actual changes
  const xChange =
    Number(userXBalance.amount) - Number(userXBalanceAfter.amount);
  const yChange =
    Number(userYBalanceAfter.amount) - Number(userYBalance.amount);

  console.log("\n📊 Swap Summary:");
  if (isX) {
    console.log("A tokens spent:", (xChange / 1_000_000).toFixed(6));
    console.log("B tokens received:", (yChange / 1_000_000).toFixed(6));
    console.log("Effective rate:", (yChange / xChange).toFixed(6));
  } else {
    console.log("B tokens spent:", (yChange / 1_000_000).toFixed(6));
    console.log("A tokens received:", (xChange / 1_000_000).toFixed(6));
    console.log("Effective rate:", (xChange / yChange).toFixed(6));
  }

  // Show new price ratio
  const newRatio =
    Number(vaultYBalanceAfter.amount) / Number(vaultXBalanceAfter.amount);
  console.log(
    `\n💰 New Price Ratio: 1 Token X = ${newRatio.toFixed(6)} Token Y`
  );
  console.log(
    `Price Impact: ${(((newRatio - currentRatio) / currentRatio) * 100).toFixed(
      4
    )}%`
  );
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
