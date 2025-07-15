import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { IDL, MPL_CORE_PROGRAM_ID } from "../programs/Turbin3_prereq";
import wallet from "../wallet";

(async () => {
  try {
    // Setup connection and wallet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    const keypair = Keypair.fromSecretKey(Uint8Array.from(wallet));
    const walletObj = new Wallet(keypair);
    const provider = new AnchorProvider(connection, walletObj, {
      commitment: "confirmed",
    });
    const program = new Program(IDL, provider);

    // Derive PDA for 'account'
    const [accountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("prereqs"), keypair.publicKey.toBuffer()],
      program.programId
    );

    // Mint Collection public key from teacher's note
    const mintCollection = new PublicKey(
      "5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2"
    );

    // Generate new mint account for the NFT
    const mintTs = Keypair.generate();

    // Derive authority PDA for collection (from IDL seeds for 'authority')
    const [authority] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), mintCollection.toBuffer()],
      program.programId
    );

    // Submit the TS prereq and mint NFT
    const tx = await program.methods
      .submitTs()
      .accounts({
        user: keypair.publicKey,
        account: accountKey,
        mint: mintTs.publicKey,
        collection: mintCollection,
        authority,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair, mintTs])
      .rpc();

    console.log(
      `✅ Submit TS TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
  } catch (error) {
    console.error("❌ Submit error:", error);
  }
})();
