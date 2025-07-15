import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import wallet from "../wallet";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Load dev wallet
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

// Turbin3 wallet
const to = new PublicKey(process.env.WALLET_1_ADDRESS);

// Connect to devnet
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    // Get wallet balance
    const balance = await connection.getBalance(from.publicKey);

    // Build dummy tx to calculate fee
    let tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      })
    );
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = from.publicKey;

    const fee =
      (await connection.getFeeForMessage(tx.compileMessage())).value || 0;

    // Replace instruction with correct amount (minus fee)
    tx.instructions = [];
    tx.add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      })
    );

    // Sign and send
    const sig = await sendAndConfirmTransaction(connection, tx, [from]);
    console.log(
      `Drained. Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
  } catch (e) {
    console.error("Error draining wallet:", e);
  }
})();
