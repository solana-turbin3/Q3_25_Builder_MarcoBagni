import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.vault as Program<Vault>;

  console.log("Initializing vault for d1x wallet...");
  const tx = await program.methods.initialize().rpc();
  console.log("Vault initialized:", tx);
}

main().catch(console.error);
