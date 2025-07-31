import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as readline from "readline";
import * as fs from "fs";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import BN from "bn.js";
import * as os from "os";

// Load config
interface WalletConfig {
  ADMIN_WALLET: string;
  USER_1_WALLET: string;
  USER_2_WALLET: string;
}
const config: WalletConfig = JSON.parse(
  fs.readFileSync("./config.json", "utf8")
);

// Set admin wallet as environment variable
process.env.ANCHOR_WALLET = config.ADMIN_WALLET.replace("~", os.homedir());

// Program setup
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.marketplace;
const connection = provider.connection;

// PDA addresses
const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("marketplace")],
  program.programId
)[0];

const treasury = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("treasury"), marketplace.toBuffer()],
  program.programId
)[0];

// App state
const currentWallet = provider.wallet.publicKey.toString();

// Utility functions
function calculateMetadataAccounts(nftMint: PublicKey) {
  const metadataProgramId = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

  const metadata = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), metadataProgramId.toBuffer(), nftMint.toBuffer()],
    metadataProgramId
  )[0];

  const masterEdition = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      metadataProgramId.toBuffer(),
      nftMint.toBuffer(),
      Buffer.from("edition"),
    ],
    metadataProgramId
  )[0];

  return { metadata, masterEdition };
}

async function getAccountInfo(pubkey: PublicKey, label: string) {
  try {
    const accountInfo = await connection.getAccountInfo(pubkey);
    const balance = await connection.getBalance(pubkey);

    console.log(`\n${label}:`);
    console.log(`  Address: ${pubkey.toString()}`);
    console.log(`  Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    return { exists: !!accountInfo, balance };
  } catch (error) {
    console.log(`  Error fetching ${label}: ${error}`);
    return { exists: false, balance: 0 };
  }
}

async function fetchAllListings(): Promise<any[]> {
  const accounts = await connection.getProgramAccounts(program.programId);
  const listings: any[] = [];

  for (const account of accounts) {
    try {
      const listingData = await program.account.listing.fetch(account.pubkey);

      listings.push({
        address: account.pubkey.toString(),
        seller: listingData.seller.toString(),
        mint: listingData.mint.toString(),
        price: listingData.price.toNumber() / LAMPORTS_PER_SOL,
        isActive: listingData.isActive,
      });
    } catch (error) {
      // Not a listing account, skip
      continue;
    }
  }

  return listings;
}

// Core functions
async function showWelcome() {
  console.log("\n" + "=".repeat(60));
  console.log("MARKETPLACE ADMIN APP");
  console.log("=".repeat(60));
  console.log(`Admin Wallet: ${currentWallet}`);
  console.log("=".repeat(60));
}

async function showOverview() {
  console.log("\n" + "=".repeat(60));
  console.log("MARKETPLACE OVERVIEW");
  console.log("=".repeat(60));

  // Core accounts
  await getAccountInfo(marketplace, "Marketplace Account");
  await getAccountInfo(treasury, "Treasury Account");

  // Current wallet info
  const walletBalance = await connection.getBalance(provider.wallet.publicKey);
  console.log(`\nAdmin Wallet:`);
  console.log(`  Address: ${currentWallet}`);
  console.log(`  Balance: ${walletBalance / LAMPORTS_PER_SOL} SOL`);

  // Program info
  console.log(`\nProgram Info:`);
  console.log(`  Program ID: ${program.programId.toString()}`);
  console.log(`  Cluster: ${connection.rpcEndpoint}`);

  console.log("\n" + "=".repeat(60));
}

async function initializeMarketplace() {
  try {
    console.log("\nInitializing marketplace...");

    // Check if marketplace already exists
    const marketplaceInfo = await connection.getAccountInfo(marketplace);
    if (marketplaceInfo) {
      console.log("⚠️  Marketplace already exists!");
      console.log("   Address:", marketplace.toString());
      console.log("   Size:", marketplaceInfo.data.length, "bytes");
      return;
    }

    const tx = await program.methods
      .initializeMarketplace(1) // 1% fee
      .accountsPartial({
        admin: provider.wallet.publicKey,
        marketplace,
        treasury,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Marketplace initialized successfully!");
    console.log(`Transaction: ${tx}`);
  } catch (error) {
    console.log("❌ Failed to initialize marketplace:", error);
  }
}

async function viewMarketplaceState() {
  try {
    console.log("\n📊 Marketplace State:");

    const marketplaceData = await program.account.marketplace.fetch(
      marketplace
    );

    console.log(`Admin: ${marketplaceData.admin.toString()}`);
    console.log(`Fee Percentage: ${marketplaceData.feePercentage}%`);
    console.log(`Bump: ${marketplaceData.bump}`);
    console.log(`Treasury Bump: ${marketplaceData.treasuryBump}`);
  } catch (error) {
    console.log(
      "❌ Marketplace not initialized yet. Please initialize it first."
    );
  }
}

async function updateFeePercentage() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n💰 Update Fee Percentage");
    console.log("Current fee: 1%");

    const newFee = await new Promise<string>((resolve) => {
      rl.question("Enter new fee percentage (0-100): ", resolve);
    });

    const feeNumber = parseInt(newFee);
    if (feeNumber < 0 || feeNumber > 100) {
      console.log("❌ Invalid fee percentage. Must be between 0 and 100.");
      rl.close();
      return;
    }

    // Note: This would require adding an update_fee instruction to the program
    console.log("⚠️  Update fee functionality not implemented in program yet.");
    console.log(
      "You would need to add an update_fee instruction to the Rust program."
    );
  } catch (error) {
    console.log("❌ Error updating fee:", error);
  } finally {
    rl.close();
  }
}

async function delistNFT() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n🗑️  Delist NFT");

    const listings = await fetchAllListings();
    const activeListings = listings.filter((l) => l.isActive);

    if (activeListings.length === 0) {
      console.log("❌ No active listings found.");
      rl.close();
      return;
    }

    console.log("Active Listings:");
    activeListings.forEach((listing, index) => {
      console.log(
        `${index + 1}. NFT: ${listing.mint} | Price: ${
          listing.price
        } SOL | Seller: ${listing.seller}`
      );
    });

    const choice = await new Promise<string>((resolve) => {
      rl.question("Enter listing number to delist (or 'cancel'): ", resolve);
    });

    if (choice.toLowerCase() === "cancel") {
      console.log("❌ Delisting cancelled.");
      rl.close();
      return;
    }

    const listingIndex = parseInt(choice) - 1;
    if (listingIndex < 0 || listingIndex >= activeListings.length) {
      console.log("❌ Invalid listing number.");
      rl.close();
      return;
    }

    const selectedListing = activeListings[listingIndex];
    console.log(`⚠️  Delisting functionality requires seller signature.`);
    console.log(`Selected listing: ${selectedListing.mint}`);
    console.log(`Seller: ${selectedListing.seller}`);
  } catch (error) {
    console.log("❌ Error delisting NFT:", error);
  } finally {
    rl.close();
  }
}

async function showAdminOptions() {
  console.log("\nADMIN OPTIONS:");

  // Check if marketplace is initialized
  let marketplaceExists = false;
  try {
    await program.account.marketplace.fetch(marketplace);
    marketplaceExists = true;
  } catch (error) {
    // Marketplace not initialized
  }

  if (!marketplaceExists) {
    console.log("0. Initialize Marketplace");
  }

  console.log("1. View Marketplace");
  console.log("2. Update fee percentage");
  console.log("3. Delist NFT");
  console.log("4. Exit");
}

async function handleAdminChoice(choice: string) {
  // Check if marketplace is initialized
  let marketplaceExists = false;
  try {
    await program.account.marketplace.fetch(marketplace);
    marketplaceExists = true;
  } catch (error) {
    // Marketplace not initialized
  }

  switch (choice) {
    case "0":
      if (!marketplaceExists) {
        await initializeMarketplace();
      } else {
        console.log("❌ Invalid choice.");
      }
      break;
    case "1":
      await viewMarketplaceState();
      break;
    case "2":
      await updateFeePercentage();
      break;
    case "3":
      await delistNFT();
      break;
    case "4":
      console.log("\n👋 Goodbye!");
      process.exit(0);
      break;
    default:
      console.log("❌ Invalid choice. Please try again.");
  }
}

async function showMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    await showAdminOptions();

    const choice = await new Promise<string>((resolve) => {
      rl.question("\nEnter your choice: ", resolve);
    });

    await handleAdminChoice(choice);

    console.log("\n" + "-".repeat(40));
  }
}

async function main() {
  console.log("🚀 Marketplace Admin App Starting...");

  // Show welcome
  await showWelcome();

  // Show overview
  await showOverview();

  // Show interactive menu
  await showMenu();
}

// Run the app
main().catch(console.error);
