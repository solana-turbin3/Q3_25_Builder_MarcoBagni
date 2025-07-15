import * as web3 from "@solana/web3.js";
import wallet from "../wallet.ts";
import dotenv from "dotenv";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// Load environment variables
dotenv.config();

const keypair = web3.Keypair.fromSecretKey(new Uint8Array(wallet));

const commitment: web3.Commitment = "confirmed";
const connection = new web3.Connection(
  "https://api.devnet.solana.com",
  commitment
);

// Handle undefined environment variables
const mintAddress = process.env.MINT_T_2_ADDRESS;
const recipientAddress = process.env.WALLET_3_ADDRESS;

if (!mintAddress) {
  throw new Error("MINT_T_2_ADDRESS environment variable is not set");
}

if (!recipientAddress) {
  throw new Error("WALLET_3_ADDRESS environment variable is not set");
}

const mint = new web3.PublicKey(mintAddress);
const to = new web3.PublicKey(recipientAddress);

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
      4_700_000n
    );
    console.log(`Transfer successful: ${signature}`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
