import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Staking } from "../target/types/staking";

async function initializeProgram() {
  // Set up provider
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Staking as Program<Staking>;

  // Get your program ID (replace with your actual program ID)
  const programId = new PublicKey(
    "5HKADJFrrocX1PrXdTBxzJEPGZA5xg4EbRMz19aZJmRR"
  );

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  );

  const [rewardMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), configPda.toBuffer()],
    programId
  );

  console.log("Config PDA:", configPda.toString());
  console.log("Reward Mint PDA:", rewardMintPda.toString());

  try {
    // Initialize config with your desired parameters
    const tx = await program.methods
      .initializeConfig(10, 5, 86400) // 10 points, max 5 unstake, 24h freeze
      .accounts({
        admin: provider.wallet.publicKey,
        config: configPda,
        rewardMint: rewardMintPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("✅ Config initialized successfully!");
    console.log("Transaction signature:", tx);
  } catch (error) {
    console.error("❌ Failed to initialize config:", error);
  }
}

initializeProgram();
