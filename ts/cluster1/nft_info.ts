import { Connection, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

// Use environment variable for NFT address
//const nftAddress = process.env.NFT_ADDRESS;
const nftAddress = process.env.MINT_T_1_ADDRESS;

//const connection = new Connection("https://api.mainnet-beta.solana.com");
const connection = new Connection("https://api.devnet.solana.com");

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return metadataPDA;
}

async function getNFTInfo(mintAddress: string) {
  try {
    console.log(`🔍 Fetching NFT info for: ${mintAddress}`);

    // Convert string to public key
    const mint = new PublicKey(mintAddress);

    // Get the mint account info
    const accountInfo = await connection.getAccountInfo(mint);

    if (!accountInfo) {
      console.log("❌ NFT not found or invalid mint address");
      return;
    }

    console.log("✅ NFT Found!");
    console.log(`Mint Address: ${mintAddress}`);
    console.log(`Owner: ${accountInfo.owner.toString()}`);
    console.log(`Lamports: ${accountInfo.lamports}`);
    console.log(`Data Length: ${accountInfo.data.length} bytes`);
    console.log(`Executable: ${accountInfo.executable}`);
    console.log(`Rent Epoch: ${accountInfo.rentEpoch}`);

    // Get token supply
    try {
      const supply = await connection.getTokenSupply(mint);
      console.log(
        `Supply: ${supply.value.amount} (decimals: ${supply.value.decimals})`
      );
    } catch (e) {
      console.log("⚠️ Could not fetch token supply");
    }

    // Get metadata account
    console.log("\n📄 Fetching Metadata...");
    const metadataPDA = await getMetadataPDA(mint);
    console.log(`Metadata Account: ${metadataPDA.toString()}`);

    const metadataAccount = await connection.getAccountInfo(metadataPDA);

    if (metadataAccount) {
      console.log("✅ Metadata Account Found!");
      console.log(`Metadata Data Length: ${metadataAccount.data.length} bytes`);

      // Just show the raw data for now
      console.log("\n🔍 Raw Metadata Data (first 100 bytes):");
      console.log(metadataAccount.data.slice(0, 100));
    } else {
      console.log("❌ No metadata account found");
    }

    // Get largest accounts (holders)
    try {
      const largestAccounts = await connection.getTokenLargestAccounts(mint);
      console.log(
        `\n👥 Largest accounts: ${largestAccounts.value.length} holders`
      );
    } catch (e) {
      console.log("⚠️ Could not fetch holder info");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Check if NFT_ADDRESS is set in environment
if (!nftAddress) {
  console.log("❌ MINT_T_1_ADDRESS environment variable is not set");
  process.exit(1);
}

getNFTInfo(nftAddress);
