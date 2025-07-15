import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.vault as Program<Vault>;

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const wallet = provider.wallet;

  console.log("Checking vaults for wallet:", wallet.publicKey.toString());

  // Calculate your vault PDAs
  const [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultStatePda.toBuffer()],
    program.programId
  );

  console.log("Vault PDA:", vaultPda.toString());
  console.log("Vault State PDA:", vaultStatePda.toString());

  // Check if vault exists
  const vaultAccount = await program.provider.connection.getAccountInfo(
    vaultPda
  );
  if (vaultAccount) {
    console.log(
      "✅ Vault exists with balance:",
      vaultAccount.lamports / 1e9,
      "SOL"
    );
  } else {
    console.log("❌ Vault does not exist");
  }
}

main().catch(console.error);
