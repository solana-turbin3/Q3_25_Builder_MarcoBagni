import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import * as fs from "fs";
import * as readline from "readline";
import { homedir } from "os";

// Set environment variables if not already set
if (!process.env.ANCHOR_PROVIDER_URL) {
  process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
}
if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = homedir() + "/.config/solana/d1x.json";
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

  console.log("💸 Interactive Liquidity Withdrawal");
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
  console.log(
    `LP Token Supply: ${(Number(lpMintInfo.supply) / 1_000_000).toFixed(6)}`
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

  console.log("\n👤 Your Current Balances:");
  console.log(
    `Token A: ${(Number(userXBalance.amount) / 1_000_000).toFixed(6)}`
  );
  console.log(
    `Token B: ${(Number(userYBalance.amount) / 1_000_000).toFixed(6)}`
  );
  console.log(
    `LP Tokens: ${(Number(userLpBalance.amount) / 1_000_000).toFixed(6)}`
  );

  // Interactive withdrawal
  console.log("\n💸 Interactive Withdrawal");
  console.log("-".repeat(30));

  // Ask user how many LP tokens to withdraw
  const lpAmountStr = await askQuestion(
    "How many LP tokens do you want to withdraw? (e.g., 0.01): "
  );
  const lpAmount = parseFloat(lpAmountStr);

  if (isNaN(lpAmount) || lpAmount <= 0) {
    console.log("❌ Invalid amount. Please enter a positive number.");
    rl.close();
    return;
  }

  // Convert to raw units
  const lpAmountRaw = Math.floor(lpAmount * 1_000_000);

  // Check if user has sufficient LP tokens
  if (userLpBalance.amount < BigInt(lpAmountRaw)) {
    console.log(
      `❌ Insufficient LP tokens. You have ${(
        Number(userLpBalance.amount) / 1_000_000
      ).toFixed(6)} but need ${lpAmount.toFixed(6)}`
    );
    rl.close();
    return;
  }

  // Calculate proportional token amounts you'll receive
  const tokenXAmount = Math.floor(
    (lpAmountRaw * Number(vaultXBalance.amount)) / Number(lpMintInfo.supply)
  );
  const tokenYAmount = Math.floor(
    (lpAmountRaw * Number(vaultYBalance.amount)) / Number(lpMintInfo.supply)
  );

  console.log(`\n📊 You will receive:`);
  console.log(`Token A: ${(tokenXAmount / 1_000_000).toFixed(6)}`);
  console.log(`Token B: ${(tokenYAmount / 1_000_000).toFixed(6)}`);
  console.log(`LP Tokens to burn: ${lpAmount.toFixed(6)}`);

  // Ask for confirmation
  const confirm = await askQuestion("\nProceed with withdrawal? (y/n): ");

  if (
    confirm.toLowerCase() !== "y" &&
    confirm.toLowerCase() !== "" &&
    confirm.toLowerCase() !== "yes"
  ) {
    console.log("❌ Withdrawal cancelled.");
    rl.close();
    return;
  }

  console.log("\n💸 Executing withdrawal...");

  try {
    const tx = await program.methods
      .withdraw(new BN(lpAmountRaw), new BN(tokenXAmount), new BN(tokenYAmount))
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

    console.log("✅ Withdrawal successful!");
    console.log(
      `Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );

    // Show updated balances
    console.log("\n📈 Updated Balances:");
    const newUserXBalance = await getAccount(connection, userAtaX.address);
    const newUserYBalance = await getAccount(connection, userAtaY.address);
    const newUserLpBalance = await getAccount(connection, userLpAta.address);

    console.log(
      `Your Token A: ${(Number(newUserXBalance.amount) / 1_000_000).toFixed(
        6
      )} (was: ${(Number(userXBalance.amount) / 1_000_000).toFixed(6)})`
    );
    console.log(
      `Your Token B: ${(Number(newUserYBalance.amount) / 1_000_000).toFixed(
        6
      )} (was: ${(Number(userYBalance.amount) / 1_000_000).toFixed(6)})`
    );
    console.log(
      `Your LP Tokens: ${(Number(newUserLpBalance.amount) / 1_000_000).toFixed(
        6
      )} (burned: -${lpAmount.toFixed(6)})`
    );
  } catch (error) {
    console.log("❌ Withdrawal failed:", error);
    if (error.error?.errorCode?.code === "SlippageExceeded") {
      console.log("\n💡 Tip: The amounts don't match the current pool ratio.");
      console.log("Try using smaller amounts or check the pool state first.");
    }
  }

  rl.close();
}

main().catch(console.error);
