import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
} from "@solana/spl-token";
import * as fs from "fs";
import * as readline from "readline";
import { homedir } from "os";

// Set environment variables if not already set
if (!process.env.ANCHOR_PROVIDER_URL) {
  process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
}
if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = homedir() + "/.config/solana/d3x.json";
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt user
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    } catch (error) {
      // Handle case where readline is closed
      resolve("");
    }
  });
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.amm;
  const connection = provider.connection;
  const admin = provider.wallet;

  console.log("💰 Interactive Liquidity Deposit");
  console.log("=".repeat(50));
  console.log("User:", admin.publicKey.toString());

  // Load pool info
  const poolInfo = JSON.parse(fs.readFileSync("pool-info.json", "utf8"));
  console.log("\n📊 Pool Info:");
  console.log("Config PDA:", poolInfo.configPda);
  console.log("LP Mint:", poolInfo.lpMint);

  // Get current pool state
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

  console.log("\n📈 Current Pool State:");
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

  // Calculate current ratio
  const currentRatio =
    Number(vaultYBalance.amount) / Number(vaultXBalance.amount);
  console.log(
    `\n⚖️ Current Ratio: 1 Token A = ${currentRatio.toFixed(6)} Token B`
  );

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

  // Check user balances
  const userXBalance = await getAccount(connection, userAtaX.address);
  const userYBalance = await getAccount(connection, userAtaY.address);
  const userLpBalance = await getAccount(connection, userLpAta.address);

  console.log("\n🔍 Your Current Balances:");
  console.log(
    `Token A: ${(Number(userXBalance.amount) / 1_000_000).toFixed(6)}`
  );
  console.log(
    `Token B: ${(Number(userYBalance.amount) / 1_000_000).toFixed(6)}`
  );

  // Store original balances for comparison
  const originalUserXBalance = userXBalance.amount;
  const originalUserYBalance = userYBalance.amount;
  const originalUserLpBalance = userLpBalance.amount;
  const originalVaultXBalance = vaultXBalance.amount;
  const originalVaultYBalance = vaultYBalance.amount;

  // Interactive deposit
  console.log("\n💧 Interactive Deposit");
  console.log("-".repeat(30));

  // Ask user which token they want to deposit
  const tokenChoice = await askQuestion(
    "Which token do you want to deposit? (A/B): "
  );

  let tokenAAmount: number;
  let tokenBAmount: number;

  if (tokenChoice.toLowerCase() === "a") {
    // User wants to deposit Token A
    const amountStr = await askQuestion(
      "How much Token A do you want to deposit? (e.g., 0.002): "
    );
    tokenAAmount = parseFloat(amountStr);

    if (isNaN(tokenAAmount) || tokenAAmount <= 0) {
      console.log("❌ Invalid amount. Please enter a positive number.");
      rl.close();
      return;
    }

    // Calculate proportional Token B amount
    tokenBAmount = tokenAAmount * currentRatio;

    console.log(`\n📊 Calculated amounts:`);
    console.log(`Token A: ${tokenAAmount.toFixed(6)}`);
    console.log(`Token B: ${tokenBAmount.toFixed(6)} (maintains pool ratio)`);
  } else if (tokenChoice.toLowerCase() === "b") {
    // User wants to deposit Token B
    const amountStr = await askQuestion(
      "How much Token B do you want to deposit? (e.g., 0.2): "
    );
    tokenBAmount = parseFloat(amountStr);

    if (isNaN(tokenBAmount) || tokenBAmount <= 0) {
      console.log("❌ Invalid amount. Please enter a positive number.");
      rl.close();
      return;
    }

    // Calculate proportional Token A amount
    tokenAAmount = tokenBAmount / currentRatio;

    console.log(`\n📊 Calculated amounts:`);
    console.log(`Token A: ${tokenAAmount.toFixed(6)} (maintains pool ratio)`);
    console.log(`Token B: ${tokenBAmount.toFixed(6)}`);
  } else {
    console.log("❌ Invalid choice. Please enter 'A' or 'B'.");
    rl.close();
    return;
  }

  // Convert to raw units (6 decimals)
  const tokenARaw = Math.floor(tokenAAmount * 1_000_000);
  const tokenBRaw = Math.floor(tokenBAmount * 1_000_000);

  // Calculate LP tokens to mint using geometric mean
  const lpTokensToMint = Math.floor(Math.sqrt(tokenARaw * tokenBRaw));

  console.log(
    `\n🎯 LP Tokens to mint: ${(lpTokensToMint / 1_000_000).toFixed(
      6
    )} (geometric mean)`
  );

  // For subsequent deposits, we need to calculate the exact amounts the program expects
  // The program uses: x = (lpTokens * vaultX) / lpSupply, y = (lpTokens * vaultY) / lpSupply
  let maxX: number;
  let maxY: number;

  if (
    lpMintInfo.supply === BigInt(0) &&
    vaultXBalance.amount === BigInt(0) &&
    vaultYBalance.amount === BigInt(0)
  ) {
    // First deposit - use our calculated amounts
    maxX = tokenARaw;
    maxY = tokenBRaw;
  } else {
    // Subsequent deposits - calculate what the program expects
    maxX = Math.floor(
      (lpTokensToMint * Number(vaultXBalance.amount)) /
        Number(lpMintInfo.supply)
    );
    maxY = Math.floor(
      (lpTokensToMint * Number(vaultYBalance.amount)) /
        Number(lpMintInfo.supply)
    );

    console.log(`\n📊 Program expects:`);
    console.log(`Token A: ${(maxX / 1_000_000).toFixed(6)}`);
    console.log(`Token B: ${(maxY / 1_000_000).toFixed(6)}`);
  }

  // Check if user has sufficient tokens
  if (userXBalance.amount < BigInt(maxX)) {
    console.log(
      `❌ Insufficient Token A balance. Need ${maxX / 1_000_000} but have ${
        Number(userXBalance.amount) / 1_000_000
      }`
    );
    rl.close();
    return;
  }

  if (userYBalance.amount < BigInt(maxY)) {
    console.log(
      `❌ Insufficient Token B balance. Need ${maxY / 1_000_000} but have ${
        Number(userYBalance.amount) / 1_000_000
      }`
    );
    rl.close();
    return;
  }

  // Ask for confirmation
  const confirm = await askQuestion("\nProceed with deposit? (y/n): ");

  if (
    confirm.toLowerCase() !== "y" &&
    confirm.toLowerCase() !== "" &&
    confirm.toLowerCase() !== "yes"
  ) {
    console.log("❌ Deposit cancelled.");
    rl.close();
    return;
  }

  console.log("\n💧 Executing deposit...");

  try {
    const tx = await program.methods
      .deposit(new BN(lpTokensToMint), new BN(maxX), new BN(maxY))
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
        userAtaLp: userLpAta.address,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Deposit successful!");
    console.log(
      `Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // Show updated balances
    console.log("\n📈 Updated Balances:");
    const newUserXBalance = await getAccount(connection, userAtaX.address);
    const newUserYBalance = await getAccount(connection, userAtaY.address);
    const newUserLpBalance = await getAccount(connection, userLpAta.address);
    const newVaultXBalance = await getAccount(
      connection,
      new anchor.web3.PublicKey(poolInfo.vaultX)
    );
    const newVaultYBalance = await getAccount(
      connection,
      new anchor.web3.PublicKey(poolInfo.vaultY)
    );

    console.log(
      `Your Token A: ${(Number(newUserXBalance.amount) / 1_000_000).toFixed(
        6
      )} (was: ${(Number(originalUserXBalance) / 1_000_000).toFixed(6)})`
    );
    console.log(
      `Your Token B: ${(Number(newUserYBalance.amount) / 1_000_000).toFixed(
        6
      )} (was: ${(Number(originalUserYBalance) / 1_000_000).toFixed(6)})`
    );
    console.log(
      `Your LP Tokens: ${(Number(newUserLpBalance.amount) / 1_000_000).toFixed(
        6
      )} (new: +${(lpTokensToMint / 1_000_000).toFixed(6)})`
    );
    console.log(
      `Vault X (Token A): ${(
        Number(newVaultXBalance.amount) / 1_000_000
      ).toFixed(6)} (was: ${(Number(originalVaultXBalance) / 1_000_000).toFixed(
        6
      )})`
    );
    console.log(
      `Vault Y (Token B): ${(
        Number(newVaultYBalance.amount) / 1_000_000
      ).toFixed(6)} (was: ${(Number(originalVaultYBalance) / 1_000_000).toFixed(
        6
      )})`
    );
  } catch (error) {
    console.log("❌ Deposit failed:", error);
    if (error.error?.errorCode?.code === "SlippageExceeded") {
      console.log("\n💡 Tip: The amounts don't match the current pool ratio.");
      console.log("Try using smaller amounts or check the pool state first.");
    }
  }

  rl.close();
}

main().catch(console.error);
