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
import * as readline from "readline";
import { BN } from "bn.js";

// ============================================================================
// CONFIGURATION - Load from config.json
// ============================================================================

// Load config
const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

// NFT Configuration
const NFT_MINT_ADDRESS = config.nft.mintAddress;
const NFT_OWNER_WALLET = config.wallet.path;

// Staking Configuration
const POINTS_PER_STAKE = config.staking.pointsPerStake;
const MAX_UNSTAKE = config.staking.maxUnstake;
const FREEZE_PERIOD = config.staking.freezePeriod;

// Network Configuration
const NETWORK = config.network.cluster;

// Helper function to expand tilde
function expandTilde(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

// Helper function to get user input
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

// Add this function after the helper functions
async function checkStakeAccount(
  connection: anchor.web3.Connection,
  program: Program<any>,
  userKeypair: Keypair,
  nftMint: PublicKey
) {
  const [stakeAccountPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      userKeypair.publicKey.toBuffer(),
      nftMint.toBuffer(),
    ],
    program.programId
  );

  try {
    const stakeAccountInfo = await connection.getAccountInfo(stakeAccountPda);
    if (stakeAccountInfo) {
      console.log(`📊 Stake Account: ${stakeAccountPda.toString()}`);
      console.log(`   Size: ${stakeAccountInfo.data.length} bytes`);
      console.log(`   Owner: ${stakeAccountInfo.owner.toString()}`);
      console.log(`   Lamports: ${stakeAccountInfo.lamports}`);
      console.log(`   Data: ${stakeAccountInfo.data.toString("hex")}`);
    } else {
      console.log("📊 Stake Account: Not found");
    }
  } catch (error) {
    console.log("📊 Stake Account: Error checking");
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("🚀 Starting Interactive NFT Staking App...");
  console.log(` Network: ${NETWORK}`);
  console.log(`🎯 NFT Mint: ${NFT_MINT_ADDRESS}`);
  console.log(
    `⏰ Freeze Period: ${FREEZE_PERIOD} seconds (${FREEZE_PERIOD / 3600} hours)`
  );
  console.log("");

  // Load user wallet
  const walletPath = expandTilde(NFT_OWNER_WALLET);
  const userKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  console.log(`👤 User wallet: ${userKeypair.publicKey.toString()}`);

  // Set up provider and program
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

  // Convert NFT mint address to PublicKey
  const nftMint = new PublicKey(NFT_MINT_ADDRESS);
  console.log(`🎨 NFT Mint: ${nftMint.toString()}`);

  // Get initial balances
  const solBalance = await connection.getBalance(userKeypair.publicKey);
  console.log(`💰 SOL Balance: ${formatSolBalance(solBalance)} SOL`);

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [rewardMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), configPda.toBuffer()],
    program.programId
  );

  const [userAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userKeypair.publicKey.toBuffer()],
    program.programId
  );

  const userNftAta = await getAssociatedTokenAddress(
    nftMint,
    userKeypair.publicKey
  );

  const [vaultAta] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), nftMint.toBuffer()],
    program.programId
  );

  // Check if user account exists
  const userAccountInfo = await connection.getAccountInfo(userAccountPda);
  if (userAccountInfo) {
    console.log("✅ User account already initialized");
    console.log(`📊 User Account: ${userAccountPda.toString()}`);
  } else {
    console.log("🆕 Initializing new user account...");

    try {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          user: userKeypair.publicKey,
          userAccount: userAccountPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("✅ New user account initialized successfully!");
      console.log(`📊 User Account: ${userAccountPda.toString()}`);
      console.log(
        ` Transaction: https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
      );
    } catch (error) {
      console.error("❌ Failed to initialize user account:", error);
      return;
    }
  }

  // Get NFT balance
  const nftBalance = await getTokenBalance(connection, userNftAta);
  console.log(` NFT Balance: ${nftBalance} tokens`);

  if (nftBalance === 0) {
    console.log("❌ You don't have any NFTs to stake!");
    console.log("Please make sure you own the NFT at:", NFT_MINT_ADDRESS);
    return;
  }

  // Ask user how many NFTs to stake
  const stakeAmount = await askQuestion(
    `\nHow many NFTs do you want to stake? (1-255): `
  );
  const amountToStake = parseInt(stakeAmount);

  if (isNaN(amountToStake) || amountToStake <= 0 || amountToStake > 255) {
    console.log("❌ Invalid amount! Please enter a number between 1 and 255");
    return;
  }

  console.log(`\n Staking ${amountToStake} NFT(s)...`);

  // Show pre-staking balances
  console.log("\n📊 Pre-staking balances:");
  console.log(`   💰 SOL: ${formatSolBalance(solBalance)} SOL`);
  console.log(`   🎨 NFT: ${nftBalance} tokens`);
  const preVaultBalance = await getTokenBalance(connection, vaultAta);
  console.log(`   🏦 Vault: ${preVaultBalance} tokens`);

  await checkStakeAccount(connection, program, userKeypair, nftMint);

  // Add the missing stakeAccountPda declaration
  const [stakeAccountPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      userKeypair.publicKey.toBuffer(),
      nftMint.toBuffer(),
    ],
    program.programId
  );

  // Check if stake account exists
  const stakeAccountInfo = await connection.getAccountInfo(stakeAccountPda);
  if (stakeAccountInfo) {
    console.log("ℹ️ Stake account exists (this is normal)");
  }

  try {
    const tx = await program.methods
      .stake(amountToStake) // Pass the amount (1-255)
      .accounts({
        user: userKeypair.publicKey,
        userAccount: userAccountPda,
        config: configPda,
        nftMint: nftMint,
        userNftAta: userNftAta,
        vaultAta: vaultAta,
        stakeAccount: stakeAccountPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .signers([userKeypair])
      .rpc();

    console.log("✅ NFT staked successfully!");
    console.log(
      `🔗 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
    );

    // Show post-staking balances
    const newSolBalance = await connection.getBalance(userKeypair.publicKey);
    const newNftBalance = await getTokenBalance(connection, userNftAta);
    const newVaultBalance = await getTokenBalance(connection, vaultAta);

    console.log("\n📊 Post-staking balances:");
    console.log(
      `   💰 SOL: ${formatSolBalance(newSolBalance)} SOL (${formatSolBalance(
        solBalance - newSolBalance
      )} SOL spent)`
    );
    console.log(
      `   🎨 NFT: ${newNftBalance} tokens (${
        nftBalance - newNftBalance
      } staked)`
    );
    console.log(
      `   🏦 Vault: ${newVaultBalance} tokens (${
        newVaultBalance - preVaultBalance
      } received)`
    );

    console.log("");
    console.log("🎉 Staking complete! Your NFT is now staked.");
    console.log(
      `⏰ You can unstake after ${FREEZE_PERIOD} seconds (${
        FREEZE_PERIOD / 3600
      } hours)`
    );
    console.log("");
    console.log("Commands:");
    console.log("  To unstake: yarn ts-node scripts/app.ts --unstake");
    console.log("  To claim rewards: yarn ts-node scripts/app.ts --claim");
    console.log("  To view stats: yarn ts-node scripts/stats.ts");
  } catch (error) {
    console.error("❌ Failed to stake NFT:", error);
  }
}

async function unstakeNFT() {
  console.log("🔄 Unstaking NFT...");

  // Load user wallet
  const walletPath = expandTilde(NFT_OWNER_WALLET);
  const userKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  // Set up provider and program
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

  // Get balances before unstaking
  const userNftAta = await getAssociatedTokenAddress(
    nftMint,
    userKeypair.publicKey
  );
  const [vaultAta] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), nftMint.toBuffer()],
    program.programId
  );

  const preNftBalance = await getTokenBalance(connection, userNftAta);
  const preVaultBalance = await getTokenBalance(connection, vaultAta);

  console.log("📊 Pre-unstaking balances:");
  console.log(`   🎨 NFT: ${preNftBalance} tokens`);
  console.log(`   🏦 Vault: ${preVaultBalance} tokens`);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [userAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userKeypair.publicKey.toBuffer()],
    program.programId
  );

  const [stakeAccountPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake"),
      userKeypair.publicKey.toBuffer(),
      nftMint.toBuffer(),
    ],
    program.programId
  );

  try {
    const tx = await program.methods
      .unstake()
      .accounts({
        user: userKeypair.publicKey,
        userAccount: userAccountPda,
        config: configPda,
        nftMint: nftMint,
        stakeAccount: stakeAccountPda,
        vaultAta: vaultAta,
        userNftAta: userNftAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .signers([userKeypair])
      .rpc();

    console.log("✅ NFT unstaked successfully!");
    console.log(
      ` Transaction: https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
    );

    // Show post-unstaking balances
    const postNftBalance = await getTokenBalance(connection, userNftAta);
    const postVaultBalance = await getTokenBalance(connection, vaultAta);

    console.log("\n📊 Post-unstaking balances:");
    console.log(
      `   🎨 NFT: ${postNftBalance} tokens (${
        postNftBalance - preNftBalance
      } received)`
    );
    console.log(
      `    Vault: ${postVaultBalance} tokens (${
        preVaultBalance - postVaultBalance
      } sent)`
    );
  } catch (error) {
    console.error("❌ Failed to unstake NFT:", error);
  }
}

async function claimRewards() {
  console.log("🎁 Claiming rewards...");

  // Load user wallet
  const walletPath = expandTilde(NFT_OWNER_WALLET);
  const userKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  // Set up provider and program
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

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [rewardMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), configPda.toBuffer()],
    program.programId
  );

  const [userAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userKeypair.publicKey.toBuffer()],
    program.programId
  );

  const userRewardAta = await getAssociatedTokenAddress(
    rewardMintPda,
    userKeypair.publicKey
  );

  // Get pre-claim balances
  const preRewardBalance = await getTokenBalance(connection, userRewardAta);

  console.log(" Pre-claim balances:");
  console.log(`   🎁 Rewards: ${preRewardBalance} tokens`);

  try {
    const tx = await program.methods
      .claimRewards()
      .accounts({
        user: userKeypair.publicKey,
        userAccount: userAccountPda,
        config: configPda,
        rewardMint: rewardMintPda,
        userRewardAta: userRewardAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([userKeypair])
      .rpc();

    console.log("✅ Rewards claimed successfully!");
    console.log(
      ` Transaction: https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
    );

    // Show post-claim balances
    const postRewardBalance = await getTokenBalance(connection, userRewardAta);

    console.log("\n📊 Post-claim balances:");
    console.log(
      `    Rewards: ${postRewardBalance} tokens (${
        postRewardBalance - preRewardBalance
      } claimed)`
    );
  } catch (error) {
    console.error("❌ Failed to claim rewards:", error);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes("--unstake")) {
  unstakeNFT();
} else if (args.includes("--claim")) {
  claimRewards();
} else {
  main();
}
