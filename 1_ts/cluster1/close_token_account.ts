import { closeAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../wallet.ts";

// === CONFIG ===
const MINT_ADDRESS = "FcM6frf8yfJs7X1WSdbaZJNFHfLyuPofJs5QsHry1thn";
const TOKEN_ACCOUNT_ADDRESS = "7UiupiJDo7fZjByAHZbL7YCMmwK8F2D8acT1RrtohSo5"; // The account we want to close
const CLUSTER_URL = "https://api.devnet.solana.com";

const connection = new Connection(CLUSTER_URL, "confirmed");
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const mint = new PublicKey(MINT_ADDRESS);
const tokenAccount = new PublicKey(TOKEN_ACCOUNT_ADDRESS);

(async () => {
  try {
    console.log(`🔍 Closing token account: ${TOKEN_ACCOUNT_ADDRESS}`);
    console.log(`Mint: ${MINT_ADDRESS}`);
    console.log(`Wallet: ${keypair.publicKey.toBase58()}`);

    const sig = await closeAccount(
      connection,
      keypair,
      tokenAccount,
      keypair.publicKey,
      keypair,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    console.log(`✅ Account closed successfully!`);
    console.log(
      `🧾 Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`
    );
    console.log(`💰 Rent recovered to your wallet`);
  } catch (e) {
    console.error("❌ Close failed:", e);
  }
})();
