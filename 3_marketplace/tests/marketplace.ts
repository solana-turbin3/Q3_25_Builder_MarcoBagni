import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Marketplace } from "../target/types/marketplace";

describe("marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.marketplace as Program<Marketplace>;

  const marketplace = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace")],
    program.programId
  )[0];
  const treasury = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    program.programId
  )[0];

  it("Initialize Marketplace", async () => {
    try {
      const tx = await program.methods
        .initializeMarketplace(1) // 1% fee
        .accountsPartial({
          admin: provider.wallet.publicKey,
          marketplace,
          treasury,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log("✅ Marketplace initialized:", tx);
    } catch (error) {
      console.log(
        "ℹ️  Marketplace might already be initialized:",
        error.message
      );
    }
  });

  it("Check Marketplace State", async () => {
    try {
      const marketplaceData = await program.account.marketplace.fetch(
        marketplace
      );
      console.log("✅ Marketplace state:");
      console.log(`   Admin: ${marketplaceData.admin.toString()}`);
      console.log(`   Fee Percentage: ${marketplaceData.feePercentage}%`);
    } catch (error) {
      console.log("❌ Error fetching marketplace state:", error.message);
    }
  });

  it("Check Treasury Balance", async () => {
    try {
      const balance = await provider.connection.getBalance(treasury);
      console.log(`✅ Treasury balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } catch (error) {
      console.log("❌ Error fetching treasury balance:", error.message);
    }
  });
});
