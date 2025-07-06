import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const user = new PublicKey(process.env.WALLET_1_ADDRESS);
const programId = new PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");

const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("prereqs"), user.toBuffer()],
  programId
);

console.log("📌 Expected PDA:", pda.toBase58());
