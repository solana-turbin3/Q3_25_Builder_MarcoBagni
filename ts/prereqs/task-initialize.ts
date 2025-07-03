import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Wallet, Program } from "@coral-xyz/anchor";
import { IDL } from "../programs/Turbin3_prereq";
import wallet from "../wallet";

(async () => {
  try {
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    const keypair = Keypair.fromSecretKey(Uint8Array.from(wallet));
    const walletObj = new Wallet(keypair);
    const provider = new AnchorProvider(connection, walletObj, {
      commitment: "confirmed",
    });

    // Cast IDL to generic Idl to avoid deep type instantiation
    const program = new Program(IDL, provider);

    const [accountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("prereqs"), keypair.publicKey.toBuffer()],
      program.programId
    );

    const githubUsername = "lostconversation";

    const tx = await program.methods
      .initialize(githubUsername)
      .accounts({
        user: keypair.publicKey,
        account: accountKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log(
      `✅ Initialize TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (error) {
    console.error("❌ Initialize error:", error);
  }
})();
