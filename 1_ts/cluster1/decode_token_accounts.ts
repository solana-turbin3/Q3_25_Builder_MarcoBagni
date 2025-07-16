import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
        programId: TOKEN_PROGRAM_ID,
      }
    );

    if (tokenAccounts.value.length === 0) {
      console.log("❌ No token accounts found in this wallet");
      return;
    }

    console.log(`\n📊 Found ${tokenAccounts.value.length} token account(s):\n`);

    for (const account of tokenAccounts.value) {
      try {
        const accountInfo = AccountLayout.decode(account.account.data);
        const mint = new PublicKey(accountInfo.mint);
        const amount = Number(accountInfo.amount);
        const owner = new PublicKey(accountInfo.owner);

        console.log(`Token Account: ${account.pubkey.toBase58()}`);
        console.log(`Mint: ${mint.toBase58()}`);
        console.log(`Owner: ${owner.toBase58()}`);
        console.log(`Amount: ${amount}`);
        console.log("---");
      } catch (e) {
        console.log(`Account: ${account.pubkey.toBase58()} - Could not decode`);
        console.log("---");
      }
    }
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
