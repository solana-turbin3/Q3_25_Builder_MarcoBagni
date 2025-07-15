import { Keypair, Connection } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../wallet.ts";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
//const commitment: Commitment = "confirmed";
const connection = new Connection("http://127.0.0.1:8899");

(async () => {
  try {
    // Start here
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6
    );

    console.log(`Mint Address: ${mint}`);
    console.log(`Mint Address: ${mint.toBase58()}`);
    console.log(`\nAdd this to your .env file:`);
    console.log(`MINT_T_1_ADDRESS=${mint.toBase58()}`);
    /* console.log(`Mint: ${mint.publicKey.toBase58()}`);
    console.log(`Mint decimals: ${mint.decimals}`);
    console.log(`Mint supply: ${mint.supply}`);
    console.log(`Mint supply: ${mint.supply}`);*/
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
