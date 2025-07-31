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

// Set user wallet as environment variable
process.env.ANCHOR_WALLET = config.USER_1_WALLET.replace("~", os.homedir());

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

async function fetchNFTMetadata(mintAddress: string): Promise<any> {
  try {
    // Get metadata account
    const metadata = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        new PublicKey(mintAddress).toBuffer(),
      ],
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
    )[0];

    const accountInfo = await connection.getAccountInfo(metadata);
    if (!accountInfo) {
      return { name: "Unknown NFT", symbol: "UNK" };
    }

    // Super simple: just get the first readable string that looks like a name
    const dataString = accountInfo.data.toString("utf8");

    // Look for strings that start with a letter and contain letters/numbers/#
    const nameMatches = dataString.match(/[A-Za-z][A-Za-z0-9#]{2,15}/g);

    if (nameMatches) {
      for (const match of nameMatches) {
        // Skip common metadata words
        if (
          !match.includes("metadata") &&
          !match.includes("edition") &&
          !match.includes("collection") &&
          !match.includes("uri") &&
          !match.includes("data") &&
          !match.includes("update") &&
          !match.includes("name") &&
          !match.includes("symbol")
        ) {
          return { name: match, symbol: "NFT" };
        }
      }
    }

    return { name: `NFT ${mintAddress.slice(0, 8)}...`, symbol: "NFT" };
  } catch (error) {
    return { name: "Unknown NFT", symbol: "UNK" };
  }
}

// Core functions
async function showWelcome() {
  console.log("\n" + "=".repeat(60));
  console.log("MARKETPLACE USER APP");
  console.log("=".repeat(60));
  console.log(`User Wallet: ${currentWallet}`);
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
  console.log(`\nUser Wallet:`);
  console.log(`  Address: ${currentWallet}`);
  console.log(`  Balance: ${walletBalance / LAMPORTS_PER_SOL} SOL`);

  // Program info
  console.log(`\nProgram Info:`);
  console.log(`  Program ID: ${program.programId.toString()}`);
  console.log(`  Cluster: ${connection.rpcEndpoint}`);

  console.log("\n" + "=".repeat(60));
}

async function listNFT() {
  try {
    console.log("\nListing NFT...");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Ask for NFT mint address
    const nftMintAddress = await new Promise<string>((resolve) => {
      rl.question("Enter NFT mint address: ", (answer) => {
        console.log(`DEBUG: Raw input: "${answer}"`);
        resolve(answer.trim());
      });
    });

    // Ask for price in SOL
    const priceInSol = await new Promise<string>((resolve) => {
      rl.question("Enter price in SOL: ", (answer) => {
        console.log(`DEBUG: Raw input: "${answer}"`);
        resolve(answer.trim());
      });
    });

    rl.close();

    // Validate inputs
    if (!nftMintAddress || !priceInSol) {
      console.log("❌ Invalid inputs provided");
      return;
    }

    try {
      const nftMint = new PublicKey(nftMintAddress);
      const priceLamports = Math.floor(
        parseFloat(priceInSol) * LAMPORTS_PER_SOL
      );
      const sellerWallet = new PublicKey(currentWallet);

      console.log("\n📋 Listing Details:");
      console.log(`  NFT Mint: ${nftMint.toString()}`);
      console.log(`  Price: ${priceInSol} SOL (${priceLamports} lamports)`);
      console.log(`  Seller: ${currentWallet}`);

      // Calculate PDAs
      const listing = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          marketplace.toBuffer(),
          sellerWallet.toBuffer(),
          nftMint.toBuffer(),
        ],
        program.programId
      )[0];

      const listingTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: listing,
      });

      const sellerTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: sellerWallet,
      });

      // Calculate metadata accounts
      const { metadata, masterEdition } = calculateMetadataAccounts(nftMint);

      console.log(`  Listing PDA: ${listing.toString()}`);
      console.log(`  Listing Token Account: ${listingTokenAccount.toString()}`);
      console.log(`  Seller Token Account: ${sellerTokenAccount.toString()}`);
      console.log(`  Metadata: ${metadata.toString()}`);
      console.log(`  Master Edition: ${masterEdition.toString()}`);

      console.log("\n🚀 Executing listing transaction...");

      const tx = await program.methods
        .listNft(new BN(priceLamports))
        .accountsPartial({
          seller: sellerWallet,
          nft: nftMint,
          listing,
          listingTokenAccount,
          sellerTokenAccount,
          marketplace,
          collectionMint: nftMint, // Use NFT mint as collection for now
          metadata,
          masterEdition,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ NFT listed successfully!");
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.log("❌ Failed to list NFT:", error);
    }
  } catch (error) {
    console.log("❌ Failed to list NFT:", error);
  }
}

async function delistNFT() {
  try {
    console.log("\nDelisting NFT...");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Ask for NFT mint address
    const nftMintAddress = await new Promise<string>((resolve) => {
      rl.question("Enter NFT mint address to delist: ", (answer) => {
        console.log(`DEBUG: Raw input: "${answer}"`);
        resolve(answer.trim());
      });
    });

    rl.close();

    if (!nftMintAddress) {
      console.log("❌ Invalid NFT mint address");
      return;
    }

    try {
      const nftMint = new PublicKey(nftMintAddress);
      const sellerWallet = new PublicKey(currentWallet);

      console.log("\n📋 Delisting Details:");
      console.log(`  NFT Mint: ${nftMint.toString()}`);
      console.log(`  Seller: ${currentWallet}`);

      // Calculate PDAs
      const listing = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          marketplace.toBuffer(),
          sellerWallet.toBuffer(),
          nftMint.toBuffer(),
        ],
        program.programId
      )[0];

      const listingTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: listing,
      });

      const sellerTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: sellerWallet,
      });

      console.log(`  Listing PDA: ${listing.toString()}`);
      console.log(`  Listing Token Account: ${listingTokenAccount.toString()}`);
      console.log(`  Seller Token Account: ${sellerTokenAccount.toString()}`);

      console.log("\n🚀 Executing delisting transaction...");

      const tx = await program.methods
        .delistNft()
        .accountsPartial({
          seller: sellerWallet,
          nft: nftMint,
          listing,
          listingTokenAccount,
          sellerTokenAccount,
          marketplace,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ NFT delisted successfully!");
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.log("❌ Failed to delist NFT:", error);
    }
  } catch (error) {
    console.log("❌ Failed to delist NFT:", error);
  }
}

async function purchaseNFT() {
  try {
    console.log("\nPurchasing NFT...");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Ask for NFT mint address
    const nftMintAddress = await new Promise<string>((resolve) => {
      rl.question("Enter NFT mint address to purchase: ", (answer) => {
        console.log(`DEBUG: Raw input: "${answer}"`);
        resolve(answer.trim());
      });
    });

    // Ask for seller address
    const sellerAddress = await new Promise<string>((resolve) => {
      rl.question("Enter seller address: ", (answer) => {
        console.log(`DEBUG: Raw input: "${answer}"`);
        resolve(answer.trim());
      });
    });

    rl.close();

    if (!nftMintAddress || !sellerAddress) {
      console.log("❌ Invalid inputs provided");
      return;
    }

    try {
      const nftMint = new PublicKey(nftMintAddress);
      const sellerWallet = new PublicKey(sellerAddress);
      const buyerWallet = new PublicKey(currentWallet);

      console.log("\n📋 Purchase Details:");
      console.log(`  NFT Mint: ${nftMint.toString()}`);
      console.log(`  Seller: ${sellerAddress}`);
      console.log(`  Buyer: ${currentWallet}`);

      // Calculate PDAs
      const listing = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("listing"),
          marketplace.toBuffer(),
          sellerWallet.toBuffer(),
          nftMint.toBuffer(),
        ],
        program.programId
      )[0];

      const listingTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: listing,
      });

      const buyerTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: buyerWallet,
      });

      const sellerTokenAccount = await anchor.utils.token.associatedAddress({
        mint: nftMint,
        owner: sellerWallet,
      });

      // Calculate metadata accounts
      const { metadata, masterEdition } = calculateMetadataAccounts(nftMint);

      console.log(`  Listing PDA: ${listing.toString()}`);
      console.log(`  Listing Token Account: ${listingTokenAccount.toString()}`);
      console.log(`  Buyer Token Account: ${buyerTokenAccount.toString()}`);
      console.log(`  Seller Token Account: ${sellerTokenAccount.toString()}`);
      console.log(`  Metadata: ${metadata.toString()}`);
      console.log(`  Master Edition: ${masterEdition.toString()}`);

      console.log("\n🚀 Executing purchase transaction...");

      const tx = await program.methods
        .purchaseNft()
        .accountsPartial({
          buyer: buyerWallet,
          seller: sellerWallet,
          nft: nftMint,
          listing,
          listingTokenAccount,
          buyerTokenAccount,
          sellerTokenAccount,
          marketplace,
          treasury: anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("treasury"), marketplace.toBuffer()],
            program.programId
          )[0],
          metadata,
          masterEdition,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ NFT purchased successfully!");
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.log("❌ Failed to purchase NFT:", error);
    }
  } catch (error) {
    console.log("❌ Failed to purchase NFT:", error);
  }
}

async function viewMyListings() {
  try {
    console.log("\nFetching my listings...");
    const sellerWallet = new PublicKey(currentWallet);

    const allListings = await fetchAllListings();
    const myListings = allListings.filter(
      (listing) => listing.seller === currentWallet
    );

    if (myListings.length === 0) {
      console.log("📭 No listings found for this wallet");
    } else {
      console.log(`📋 Found ${myListings.length} listing(s):`);
      myListings.forEach((listing, index) => {
        console.log(`\n  ${index + 1}. Listing: ${listing.address}`);
        console.log(`     NFT: ${listing.mint}`);
        console.log(`     Price: ${listing.price} SOL`);
        console.log(`     Status: ${listing.isActive ? "Active" : "Inactive"}`);
      });
    }
  } catch (error) {
    console.log("❌ Failed to fetch my listings:", error);
  }
}

async function viewMarketplace() {
  console.log("\n📊 MARKETPLACE VIEW");
  console.log("============================================================");

  const listings = await fetchAllListings();

  if (listings.length === 0) {
    console.log("📭 No NFTs have been listed in this marketplace yet.");
    return;
  }

  // Group NFTs by their latest status
  const nftStatus = new Map<string, any>();

  for (const listing of listings) {
    const existing = nftStatus.get(listing.mint);
    if (!existing || listing.isActive) {
      // Keep the most recent listing or active listing
      nftStatus.set(listing.mint, listing);
    }
  }

  const activeNFTs = Array.from(nftStatus.values()).filter((l) => l.isActive);
  const soldNFTs = Array.from(nftStatus.values()).filter((l) => !l.isActive);

  console.log(`\n🛒 ON SALE (${activeNFTs.length}):`);
  if (activeNFTs.length === 0) {
    console.log("  No NFTs currently on sale.");
  } else {
    for (const listing of activeNFTs) {
      const metadata = await fetchNFTMetadata(listing.mint);
      console.log(`  🎨 ${metadata.name}`);
      console.log(`     Mint: ${listing.mint}`);
      console.log(`     Price: ${listing.price} SOL`);
      console.log(`     Seller: ${listing.seller}`);
      console.log("");
    }
  }

  console.log(`\n💰 SOLD (${soldNFTs.length}):`);
  if (soldNFTs.length === 0) {
    console.log("  No NFTs have been sold yet.");
  } else {
    for (const listing of soldNFTs) {
      const metadata = await fetchNFTMetadata(listing.mint);
      console.log(`  🎨 ${metadata.name}`);
      console.log(`     Mint: ${listing.mint}`);
      console.log(`     Price: ${listing.price} SOL`);
      console.log(`     Current Owner: ${listing.seller}`);
      console.log("");
    }
  }
}

async function viewMyActivity() {
  console.log("\n📊 MY ACTIVITY");
  console.log("============================================================");

  const listings = await fetchAllListings();
  const myListings = listings.filter((l) => l.seller === currentWallet);

  if (myListings.length === 0) {
    console.log("📭 You have no activity in this marketplace.");
    return;
  }

  const myActiveListings = myListings.filter((l) => l.isActive);
  const mySoldListings = myListings.filter((l) => !l.isActive);

  console.log(`\n🛒 My Active Listings (${myActiveListings.length}):`);
  myActiveListings.forEach((listing, index) => {
    console.log(
      `  ${index + 1}. NFT: ${listing.mint} | Price: ${listing.price} SOL`
    );
  });

  console.log(`\n💰 My Sold NFTs (${mySoldListings.length}):`);
  mySoldListings.forEach((listing, index) => {
    console.log(
      `  ${index + 1}. NFT: ${listing.mint} | Sold for: ${listing.price} SOL`
    );
  });
}

async function burnNFT() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n🔥 Burn NFT");
    console.log("⚠️  This will permanently destroy an NFT from your wallet.");
    console.log("This action cannot be undone!");

    const mintAddress = await new Promise<string>((resolve) => {
      rl.question("Enter NFT mint address to burn (or 'cancel'): ", resolve);
    });

    if (mintAddress.toLowerCase() === "cancel") {
      console.log("❌ Burn cancelled.");
      rl.close();
      return;
    }

    console.log(`⚠️  Burn functionality requires NFT ownership verification.`);
    console.log(`Selected NFT: ${mintAddress}`);
    console.log(`Owner: ${currentWallet}`);
    console.log(`⚠️  This action will permanently destroy the NFT!`);
  } catch (error) {
    console.log("❌ Error burning NFT:", error);
  } finally {
    rl.close();
  }
}

// Menu functions
async function showUserOptions() {
  console.log("\nUSER OPTIONS:");
  console.log("1. View Marketplace");
  console.log("2. Purchase NFT");
  console.log("3. List NFT");
  console.log("4. Delist NFT");
  console.log("5. View my activity");
  console.log("6. Burn NFT");
  console.log("7. Exit");
}

async function handleUserChoice(choice: string) {
  switch (choice) {
    case "1":
      await viewMarketplace();
      break;
    case "2":
      await purchaseNFT();
      break;
    case "3":
      await listNFT();
      break;
    case "4":
      await delistNFT();
      break;
    case "5":
      await viewMyActivity();
      break;
    case "6":
      await burnNFT();
      break;
    case "7":
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
    await showUserOptions();

    const choice = await new Promise<string>((resolve) => {
      rl.question("\nEnter your choice (1-6): ", resolve);
    });

    await handleUserChoice(choice);

    console.log("\n" + "-".repeat(40));
  }
}

async function main() {
  console.log("🚀 Marketplace User App Starting...");

  // Show welcome
  await showWelcome();

  // Show overview
  await showOverview();

  // Show interactive menu
  await showMenu();
}

// Run the app
main().catch(console.error);
