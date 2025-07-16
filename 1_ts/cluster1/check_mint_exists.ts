import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// The mint you want to burn
const TARGET_MINT = "FcM6frf8yfJs7X1WSdbaZJNFHfLyuPofJs5QsHry1thn";

(async () => {
  try {
    console.log(`🔍 Checking if mint exists: ${TARGET_MINT}`);

    const mint = new PublicKey(TARGET_MINT);

    try {
      const mintInfo = await getMint(connection, mint);

      console.log("✅ Mint exists!");
      console.log(`Supply: ${Number(mintInfo.supply)}`);
      console.log(`Decimals: ${mintInfo.decimals}`);
      console.log(
        `Mint Authority: ${mintInfo.mintAuthority?.toBase58() || "None"}`
      );
      console.log(
        `Freeze Authority: ${mintInfo.freezeAuthority?.toBase58() || "None"}`
      );

      // Calculate actual supply
      const actualSupply =
        Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
      console.log(`Actual Supply: ${actualSupply}`);
    } catch (e) {
      console.log("❌ Mint does not exist or is not a valid token mint");
      console.log("Error:", e);
    }
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
