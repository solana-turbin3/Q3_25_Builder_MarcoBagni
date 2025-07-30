import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// ============================================================================
// CONFIGURATION - Load from config.json
// ============================================================================

// Load config
const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

const NFT_MINT_ADDRESS = config.nft.mintAddress;
const NFT_OWNER_WALLET = config.wallet.path;
const NETWORK = config.network.cluster;

// Helper function to expand tilde
function expandTilde(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

// Helper function to format SOL balance
function formatSolBalance(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

// Helper function to get token balance
async function getTokenBalance(
  connection: anchor.web3.Connection,
  tokenAccount: PublicKey
): Promise<number> {
  try {
    const account = await getAccount(connection, tokenAccount);
    return Number(account.amount);
  } catch (error) {
    return 0;
  }
}

// Helper function to check account existence
async function checkAccountExists(
  connection: anchor.web3.Connection,
  address: PublicKey
): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(address);
    return accountInfo !== null;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// MAIN STATS FUNCTION
// ============================================================================

async function showStats() {
  console.log("📊 NFT Staking System - Account Statistics");
  console.log("=".repeat(60));
  console.log(`🌐 Network: ${NETWORK}`);
  console.log(`🎯 NFT Mint: ${NFT_MINT_ADDRESS}`);
  console.log("");

  // Load user wallet
  const walletPath = expandTilde(NFT_OWNER_WALLET);
  const userKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  console.log(`👤 User Wallet: ${userKeypair.publicKey.toString()}`);

  // Set up connection and program
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com"
  );
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(userKeypair),
    {}
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Staking as Program<any>;
  const nftMint = new PublicKey(NFT_MINT_ADDRESS);

  console.log(`🏗️ Program ID: ${program.programId.toString()}`);
  console.log("");

  // ============================================================================
  // DERIVE ALL PDAs
  // ============================================================================

  console.log("🔍 Deriving Program Derived Addresses (PDAs)...");
  console.log("-".repeat(40));

  // 1. Config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  console.log(`📋 Config PDA: ${configPda.toString()}`);

  // 2. Reward Mint PDA
  const [rewardMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), configPda.toBuffer()],
    program.programId
  );
  console.log(`🎁 Reward Mint PDA: ${rewardMintPda.toString()}`);

  // 3. User Account PDA
  const [userAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userKeypair.publicKey.toBuffer()],
    program.programId
  );
  console.log(`👤 User Account PDA: ${userAccountPda.toString()}`);

  // 4. User NFT ATA
  const userNftAta = await getAssociatedTokenAddress(
    nftMint,
    userKeypair.publicKey
  );
  console.log(`🎨 User NFT ATA: ${userNftAta.toString()}`);

  // 5. Vault ATA
  const [vaultAta] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), nftMint.toBuffer()],
    program.programId
  );
  console.log(`🏦 Vault ATA: ${vaultAta.toString()}`);

  // 6. Stake Account PDA
  const [stakeAccountPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      userKeypair.publicKey.toBuffer(),
      nftMint.toBuffer(),
    ],
    program.programId
  );
  console.log(`📊 Stake Account PDA: ${stakeAccountPda.toString()}`);

  // 7. User Reward ATA
  const userRewardAta = await getAssociatedTokenAddress(
    rewardMintPda,
    userKeypair.publicKey
  );
  console.log(`🎁 User Reward ATA: ${userRewardAta.toString()}`);

  console.log("");

  // ============================================================================
  // CHECK ACCOUNT STATUSES
  // ============================================================================

  console.log("🔍 Checking Account Statuses...");
  console.log("-".repeat(40));

  // Check user wallet
  const userSolBalance = await connection.getBalance(userKeypair.publicKey);
  console.log(`💰 User SOL Balance: ${formatSolBalance(userSolBalance)} SOL`);

  // Check config account
  const configExists = await checkAccountExists(connection, configPda);
  console.log(
    `📋 Config Account: ${configExists ? "✅ Exists" : "❌ Not Found"}`
  );

  // Check reward mint
  const rewardMintExists = await checkAccountExists(connection, rewardMintPda);
  console.log(
    `🎁 Reward Mint: ${rewardMintExists ? "✅ Exists" : "❌ Not Found"}`
  );

  // Check user account
  const userAccountExists = await checkAccountExists(
    connection,
    userAccountPda
  );
  console.log(
    `👤 User Account: ${userAccountExists ? "✅ Exists" : "❌ Not Found"}`
  );

  // Check user NFT ATA
  const userNftBalance = await getTokenBalance(connection, userNftAta);
  console.log(`🎨 User NFT Balance: ${userNftBalance} tokens`);

  // Check vault ATA
  const vaultBalance = await getTokenBalance(connection, vaultAta);
  console.log(`🏦 Vault Balance: ${vaultBalance} tokens`);

  // Check stake account
  const stakeAccountExists = await checkAccountExists(
    connection,
    stakeAccountPda
  );
  console.log(
    `📊 Stake Account: ${stakeAccountExists ? "✅ Exists" : "❌ Not Found"}`
  );

  // Check user reward ATA
  const userRewardBalance = await getTokenBalance(connection, userRewardAta);
  console.log(`🎁 User Reward Balance: ${userRewardBalance} tokens`);

  console.log("");

  // ============================================================================
  // SHOW DETAILED ACCOUNT INFO
  // ============================================================================

  console.log("📋 Detailed Account Information...");
  console.log("-".repeat(40));

  // Config account details
  if (configExists) {
    try {
      const configInfo = await connection.getAccountInfo(configPda);
      console.log(`📋 Config Account Details:`);
      console.log(`   Size: ${configInfo?.data.length} bytes`);
      console.log(`   Owner: ${configInfo?.owner.toString()}`);
      console.log(`   Lamports: ${configInfo?.lamports}`);
    } catch (error) {
      console.log("   Error reading config account");
    }
  }

  // User account details
  if (userAccountExists) {
    try {
      const userAccountInfo = await connection.getAccountInfo(userAccountPda);
      console.log(`👤 User Account Details:`);
      console.log(`   Size: ${userAccountInfo?.data.length} bytes`);
      console.log(`   Owner: ${userAccountInfo?.owner.toString()}`);
      console.log(`   Lamports: ${userAccountInfo?.lamports}`);
    } catch (error) {
      console.log("   Error reading user account");
    }
  }

  // Stake account details
  if (stakeAccountExists) {
    try {
      const stakeAccountInfo = await connection.getAccountInfo(stakeAccountPda);
      console.log(`📊 Stake Account Details:`);
      console.log(`   Size: ${stakeAccountInfo?.data.length} bytes`);
      console.log(`   Owner: ${stakeAccountInfo?.owner.toString()}`);
      console.log(`   Lamports: ${stakeAccountInfo?.lamports}`);
      console.log(`   Data: ${stakeAccountInfo?.data.toString("hex")}`);
    } catch (error) {
      console.log("   Error reading stake account");
    }
  }

  console.log("");

  // ============================================================================
  // SHOW SYSTEM PROGRAMS
  // ============================================================================

  console.log("🔧 System Programs Used:");
  console.log("-".repeat(40));
  console.log(`🏗️ System Program: ${SystemProgram.programId.toString()}`);
  console.log(`🎨 Token Program: ${TOKEN_PROGRAM_ID.toString()}`);
  console.log(
    `🔗 Associated Token Program: ${ASSOCIATED_TOKEN_PROGRAM_ID.toString()}`
  );
  console.log(`⏰ Clock Sysvar: ${SYSVAR_CLOCK_PUBKEY.toString()}`);
  console.log(`💰 Rent Sysvar: ${SYSVAR_RENT_PUBKEY.toString()}`);

  console.log("");

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("📊 Summary:");
  console.log("-".repeat(40));
  console.log(`✅ Program Deployed: ${program.programId.toString()}`);
  console.log(`✅ User Wallet: ${userKeypair.publicKey.toString()}`);
  console.log(`✅ NFT Mint: ${nftMint.toString()}`);
  console.log(`✅ User SOL: ${formatSolBalance(userSolBalance)} SOL`);
  console.log(`✅ User NFT: ${userNftBalance} tokens`);
  console.log(`✅ Vault NFT: ${vaultBalance} tokens`);
  console.log(`✅ User Rewards: ${userRewardBalance} tokens`);
  console.log(
    `✅ Config Account: ${configExists ? "Initialized" : "Not Initialized"}`
  );
  console.log(
    `✅ User Account: ${userAccountExists ? "Initialized" : "Not Initialized"}`
  );
  console.log(
    `✅ Stake Account: ${stakeAccountExists ? "Exists" : "Not Found"}`
  );

  console.log("");
  console.log("🎉 Stats complete! All PDAs and accounts have been analyzed.");
}

// ============================================================================
// RUN THE STATS
// ============================================================================

showStats().catch(console.error);
