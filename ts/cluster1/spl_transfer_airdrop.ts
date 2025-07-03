import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../wallet";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const mint = new PublicKey(
  process.env.MINT_T_1_ADDRESS || "YOUR_MINT_ADDRESS_HERE"
);

const recipients = ["ADDRESS1", "ADDRESS2"];

(async () => {
  try {
    const fromWallet = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    for (const address of recipients) {
      const recipient = new PublicKey(address);

      const toWallet = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        recipient
      );

      const sig = await transfer(
        connection,
        keypair,
        fromWallet.address,
        toWallet.address,
        keypair.publicKey,
        1_000_000n // adjust amount here
      );

      console.log(`✅ Sent to ${address}: ${sig}`);

      // optional delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (e) {
    console.error(`❌ Airdrop failed: ${e}`);
  }
})();
