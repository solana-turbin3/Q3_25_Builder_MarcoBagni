//import dotenv from "dotenv";
//import { Keypair, PublicKey } from "@solana/web3.js";

// Load environment variables
//dotenv.config();

// Use environment variable instead of wallet file

/*const walletAddress =
  process.env.WALLET_1_ADDRESS || "YOUR_WALLET_ADDRESS_HERE";
console.log("Pubkey:", walletAddress);
*/
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

const mint = new PublicKey("HUyR8LVCxosfRQiJar1H5jStpwcwuysHKX2D5oW1cVBQ");
const owner = new PublicKey("E3zHh78ujEffBETguxjVnqPP9Ut42BCbbxXkdk9YQjLC");

const ata = await getAssociatedTokenAddress(mint, owner);
console.log("Associated Token Account:", ata.toBase58());
