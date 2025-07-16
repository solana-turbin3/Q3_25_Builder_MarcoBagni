import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../wallet.ts";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

(async () => {
  try {
    console.log(
      `🔍 Checking token balances for wallet: ${keypair.publicKey.toBase58()}`
    );

    const tokenAccounts = await connection.getTokenAccountsByOwner(
      keypair.publicKey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }
    );

    if (tokenAccounts.value.length === 0) {
      console.log("❌ No token accounts found in this wallet");
      return;
    }

    console.log(`\n📊 Found ${tokenAccounts.value.length} token account(s):\n`);

    for (const account of tokenAccounts.value) {
      console.log(`Account: ${account.pubkey.toBase58()}`);
      console.log(`Data: ${account.account.data.toString("base64")}`);
      console.log("---");
    }
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
