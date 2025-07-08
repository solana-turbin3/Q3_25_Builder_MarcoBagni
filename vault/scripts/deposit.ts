import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.vault as Program<Vault>;

  // Get the provider's wallet (d1x)
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const wallet = provider.wallet;

  console.log("Using wallet:", wallet.publicKey.toString());

  // Calculate PDAs
  const [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultStatePda.toBuffer()],
    program.programId
  );

  // Check if vault state exists
  const vaultStateAccount = await program.provider.connection.getAccountInfo(
    vaultStatePda
  );

  if (!vaultStateAccount) {
    console.log("Vault not initialized. Initializing first...");
    const initTx = await program.methods.initialize().rpc();
    console.log("Initialize transaction:", initTx);
  } else {
    console.log("Vault already initialized. Proceeding with deposit...");
  }

  // Deposit amount
  const amount = new anchor.BN(310 * 1e7); // 100,000 SOL
  console.log("Depositing", amount.toNumber() / 1e9, "SOL...");
  const depositTx = await program.methods.deposit(amount).rpc();
  console.log("Deposit transaction:", depositTx);

  // Check vault balance
  const vaultBalance = await program.provider.connection.getBalance(vaultPda);
  console.log("Vault balance:", vaultBalance / 1e9, "SOL");
}

main().catch(console.error);
