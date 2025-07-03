import dotenv from "dotenv";
//import { Keypair, PublicKey } from "@solana/web3.js";

// Load environment variables
dotenv.config();

// Use environment variable instead of wallet file
const walletAddress =
  process.env.WALLET_1_ADDRESS || "YOUR_WALLET_ADDRESS_HERE";
console.log("Pubkey:", walletAddress);
