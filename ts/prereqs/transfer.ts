import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import wallet from "../wallet";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Reconstruct keypair from wallet file
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

// Define the recipient
const to = new PublicKey(
  process.env.WALLET_1_ADDRESS || "YOUR_WALLET_ADDRESS_HERE"
);

// Setup connection
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Create transaction to send 0.1 SOL
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: 2 * LAMPORTS_PER_SOL,
      })
    );

    // Set recent blockhash & fee payer
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    transaction.feePayer = from.publicKey;

    // Sign, send, and confirm
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);

    console.log(
      `✅ Success! View your TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (e) {
    console.error(`❌ Error: ${e}`);
  }
})();
