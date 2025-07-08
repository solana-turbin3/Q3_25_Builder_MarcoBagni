import { Connection, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

const connection = new Connection("https://api.devnet.solana.com");
const user = new PublicKey(process.env.WALLET_1_ADDRESS);
const programId = new PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");

(async () => {
  try {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("prereqs"), user.toBuffer()],
      programId
    );

    const balance = await connection.getBalance(pda);

    console.log("📌 Expected PDA:", pda.toBase58());
    console.log(`PDA balance: ${balance} lamports`);
  } catch (e) {
    console.error("Error ", e);
  }
})();
