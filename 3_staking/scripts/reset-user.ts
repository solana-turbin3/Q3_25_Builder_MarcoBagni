import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const NFT_OWNER_WALLET = "/Users/marco/.config/solana/d1x.json";
const NETWORK = "devnet";

// Helper function to expand tilde
function expandTilde(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

async function resetUserAccount() {
  console.log("🔄 Resetting User Account...");
  console.log(`🌐 Network: ${NETWORK}`);
  console.log("");

  // Load user wallet
  const walletPath = expandTilde(NFT_OWNER_WALLET);
  const userKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  console.log(`👤 User wallet: ${userKeypair.publicKey.toString()}`);

  // Set up provider and program
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com"
  );
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(userKeypair),
    {}
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.Staking as Program<any>;

  // Derive user account PDA
  const [userAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userKeypair.publicKey.toBuffer()],
    program.programId
  );

  console.log(`📊 User Account PDA: ${userAccountPda.toString()}`);

  // Check if user account exists
  const userAccountInfo = await connection.getAccountInfo(userAccountPda);
  if (userAccountInfo) {
    console.log("⚠️ User account exists with old structure. Closing it...");

    // We need to close the account first. Since we can't close it from the program,
    // we'll create a new user account with a different seed
    console.log("🆕 Creating new user account with updated structure...");

    try {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          user: userKeypair.publicKey,
          userAccount: userAccountPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("✅ User account reinitialized successfully!");
      console.log(
        `🔗 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
      );
    } catch (error) {
      console.error("❌ Failed to reinitialize user account:", error);
      console.log(
        "💡 Try running: yarn ts-node scripts/app.ts --unstake first to close the stake account"
      );
    }
  } else {
    console.log("🆕 Creating new user account...");

    try {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          user: userKeypair.publicKey,
          userAccount: userAccountPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("✅ User account initialized successfully!");
      console.log(
        `🔗 Transaction: https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`
      );
    } catch (error) {
      console.error("❌ Failed to initialize user account:", error);
    }
  }
}

resetUserAccount();
