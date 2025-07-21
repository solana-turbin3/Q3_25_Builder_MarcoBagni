import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../wallet.ts";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const token_decimals = 10_000_000_000n;

// Mint address
const mintAddress =
  process.env.MINT_T_1_ADDRESS_DEVNET ||
  "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";
console.log(
  `🔍 Environment variable MINT_T_1_ADDRESS_DEVNET: ${process.env.MINT_T_1_ADDRESS_DEVNET}`
);
console.log(`🔍 Using mint address: ${mintAddress}`);

if (mintAddress === "YOUR_MINT_ADDRESS_HERE") {
  console.error("❌ Please set MINT_T_1_ADDRESS_DEVNET in your .env file");
  process.exit(1);
}

const mint = new PublicKey(mintAddress);

(async () => {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    console.log(`Your ata is: ${ata.address.toBase58()}`);
    // Mint to ATA
    const mintTx = await mintTo(
      connection,
      keypair,
      mint,
      ata.address,
      keypair.publicKey,
      token_decimals
    );
    console.log(`Your mint txid: ${mintTx}`);
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
