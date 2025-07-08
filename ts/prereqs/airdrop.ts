import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
//import wallet from "../wallet";
import dotenv from "dotenv";

dotenv.config();

//const walletPath = `${homedir()}/.config/solana/id.json`;
//const wallet = JSON.parse(fs.readFileSync(walletPath, "utf-8"));

//const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");
const recipientAddress = process.env.WALLET_2_ADDRESS;

(async () => {
  try {
    // Convert string address to PublicKey
    const recipientPublicKey = new PublicKey(recipientAddress);

    const txhash = await connection.requestAirdrop(
      recipientPublicKey,
      2 * LAMPORTS_PER_SOL
    );
    console.log(
      `✅ Success! TX: https://explorer.solana.com/tx/${txhash}?cluster=devnet`
    );
  } catch (e) {
    console.error(`❌ Error: ${e}`);
  }
})();
