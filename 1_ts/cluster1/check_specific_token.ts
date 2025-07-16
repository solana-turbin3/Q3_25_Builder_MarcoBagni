import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import wallet from "../wallet.ts";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// The mint you want to burn
const TARGET_MINT = "FcM6frf8yfJs7X1WSdbaZJNFHfLyuPofJs5QsHry1thn";

(async () => {
  try {
    console.log(`🔍 Checking for tokens of mint: ${TARGET_MINT}`);
    console.log(`Wallet: ${keypair.publicKey.toBase58()}`);

    // Check both standard SPL tokens and Token-2022 tokens
    const programs = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];

    for (const programId of programs) {
      console.log(`\n🔍 Checking program: ${programId.toBase58()}`);

      const tokenAccounts = await connection.getTokenAccountsByOwner(
        keypair.publicKey,
        {
          programId: programId,
        }
      );

      let found = false;

      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = AccountLayout.decode(account.account.data);
          const mint = new PublicKey(accountInfo.mint);
          const amount = Number(accountInfo.amount);

          if (mint.toBase58() === TARGET_MINT) {
            console.log(`✅ Found token account: ${account.pubkey.toBase58()}`);
            console.log(`Amount: ${amount}`);
            console.log(`Program: ${programId.toBase58()}`);
            found = true;
          }
        } catch (e) {
          // Skip invalid accounts
        }
      }

      if (!found) {
        console.log(
          `❌ No tokens found for mint: ${TARGET_MINT} in program: ${programId.toBase58()}`
        );
      }
    }
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
