import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getMint,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// === CONFIG ===
const mintAddress = "5m7j1rXdTNqub4WS1fkKujWhAXp2uJGEnHVCjkVwgvff";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

(async () => {
  try {
    const mint = new PublicKey(mintAddress);

    // Try both token programs
    const tokenPrograms = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];
    let mintInfo, programUsed;

    for (const program of tokenPrograms) {
      try {
        mintInfo = await getMint(connection, mint, undefined, program);
        programUsed = program.toBase58();
        break;
      } catch (_) {}
    }

    if (!mintInfo) throw new Error("Mint not found on known token programs");

    console.log("✅ Mint info:");
    console.log("  Supply:", Number(mintInfo.supply));
    console.log("  Decimals:", mintInfo.decimals);
    console.log(
      "  Mint Authority:",
      mintInfo.mintAuthority?.toBase58() || "None"
    );
    console.log(
      "  Freeze Authority:",
      mintInfo.freezeAuthority?.toBase58() || "None"
    );
    console.log("  Token Program:", programUsed);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
