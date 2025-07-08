import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";

describe("vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.vault as Program<Vault>;

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Can deposit SOL", async () => {
    const amount = new anchor.BN(1000000); // 0.001 SOL
    const tx = await program.methods.deposit(amount).rpc();
    console.log("Deposit transaction:", tx);
  });

  it("Can withdraw SOL", async () => {
    const amount = new anchor.BN(500000); // 0.0005 SOL
    const tx = await program.methods.withdraw(amount).rpc();
    console.log("Withdraw transaction:", tx);
  });
});
