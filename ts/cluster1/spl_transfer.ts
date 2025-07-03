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

const to = new PublicKey(
  process.env.WALLET_1_ADDRESS || "YOUR_WALLET_ADDRESS_HERE"
);

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromWallet = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    // Get the token account of the toWallet address, and if it does not exist, create it
    const toWallet = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to
    );

    // Transfer the new token to the "toTokenAccount" we just created
    const signature = await transfer(
      connection,
      keypair,
      fromWallet.address,
      toWallet.address,
      keypair.publicKey,
      100_000n
    );
    console.log(`Transfer successful: ${signature}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
