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

  // Check vault balance first
  const vaultBalance = await program.provider.connection.getBalance(vaultPda);
  console.log("Current vault balance:", vaultBalance / 1e9, "SOL");

  // Withdraw amount (using clean notation)
  const SOL = 10 ** 7;
  const amount = new anchor.BN(50 * SOL); // 50,000 SOL
  console.log("Withdrawing", amount.toNumber() / SOL, "SOL...");

  const withdrawTx = await program.methods.withdraw(amount).rpc();
  console.log("Withdraw transaction:", withdrawTx);

  // Check vault balance after
  const newVaultBalance = await program.provider.connection.getBalance(
    vaultPda
  );
  console.log("New vault balance:", newVaultBalance / 1e9, "SOL");
}

main().catch(console.error);
