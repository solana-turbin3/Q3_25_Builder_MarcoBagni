import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;

  const maker = Keypair.generate();
  const taker = Keypair.generate();
  const makerToken = Keypair.generate();
  const takerToken = Keypair.generate();

  beforeAll(async () => {
    // Airdrop SOL to maker and taker
    await provider.connection.requestAirdrop(maker.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(taker.publicKey, LAMPORTS_PER_SOL);
  });

  it("Can create escrow", async () => {
    const seed = Math.floor(Math.random() * 1000000);
    const offerAmount = 1000;

    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        new anchor.BN(seed).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [
        escrowPda.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        makerToken.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const makerSendAta = await getAssociatedTokenAddress(
      makerToken.publicKey,
      maker.publicKey
    );

    try {
      const tx = await program.methods
        .make(new anchor.BN(seed), new anchor.BN(offerAmount))
        .accounts({
          maker: maker.publicKey,
          makerToken: makerToken.publicKey,
          takerToken: takerToken.publicKey,
          makerSendAta: makerSendAta,
          escrow: escrowPda,
          vault: vaultPda,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc();

      console.log("Escrow created:", tx);
    } catch (error) {
      console.error("Error creating escrow:", error);
    }
  });
});
