import {
  getOrCreateAssociatedTokenAccount,
  burn,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../wallet.ts"; // your `[u8; 64]` keypair

// === CONFIG ===
const MINT_ADDRESS = "FcM6frf8yfJs7X1WSdbaZJNFHfLyuPofJs5QsHry1thn"; // put your mint address here
const CLUSTER_URL = "https://api.devnet.solana.com";

const connection = new Connection(CLUSTER_URL, "confirmed");
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const mint = new PublicKey(MINT_ADDRESS);

(async () => {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const amount = ata.amount; // burn full balance

    const sig = await burn(
      connection,
      keypair,
      ata.address,
      mint,
      keypair,
      amount,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    console.log(`🔥 Burned ${amount} tokens`);
    console.log(
      `🧾 Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
  } catch (e) {
    console.error("❌ Burn failed:", e);
  }
})();
