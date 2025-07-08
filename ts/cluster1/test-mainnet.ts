import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import dotenv from "dotenv";

dotenv.config();

// Use Helius RPC endpoint with API key
const conn = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY_1}`,
  "confirmed"
);
const mint = new PublicKey("9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump");

try {
  console.log("Fetching mint info for:", mint.toString());
  const mintInfo = await getMint(conn, mint);
  console.log("Supply:", mintInfo.supply.toString());
  console.log("Decimals:", mintInfo.decimals);
  console.log("Mint Authority:", mintInfo.mintAuthority?.toString() || "None");
  console.log(
    "Freeze Authority:",
    mintInfo.freezeAuthority?.toString() || "None"
  );
} catch (error) {
  console.error("Error fetching mint info:", error);

  // Try alternative RPC endpoint
  console.log("Trying alternative RPC endpoint...");
  const altConn = new Connection(
    "https://solana-api.projectserum.com",
    "confirmed"
  );
  try {
    const mintInfo = await getMint(altConn, mint);
    console.log("Supply:", mintInfo.supply.toString());
    console.log("Decimals:", mintInfo.decimals);
  } catch (altError) {
    console.error("Alternative RPC also failed:", altError);
  }
}
