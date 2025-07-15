import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../wallet.ts";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
//const commitment: Commitment = "confirmed";
const connection = new Connection("http://127.0.0.1:8899");

const token_decimals = 100_000_000n;

// Mint address
const mint = new PublicKey(
  process.env.MINT_T_2_ADDRESS || "YOUR_MINT_ADDRESS_HERE"
);

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
