import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Connection,
} from "@solana/web3.js";
import { Escrow } from "../target/types/escrow";

describe("escrow", () => {
  // Force connection to devnet
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const provider = new anchor.AnchorProvider(
    connection,
    anchor.getProvider().wallet,
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.escrow as Program<Escrow>;
  const programId = program.programId;
  const tokenProgram = spl.TOKEN_PROGRAM_ID; // Use regular token program

  console.log("RPC:", provider.connection.rpcEndpoint);

  const SEED = new anchor.BN(Math.floor(Math.random() * 1000000));

  // Custom token addresses (replace with your actual base58 addresses)
  const MINT_A_ADDRESS = "AWJPoHZMzLRxzbw3mtbZjAwWSxqvGpUjGNL676LFLeb2";
  const MINT_B_ADDRESS = "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";

  // Custom taker address (replace with actual taker's wallet address)
  const TAKER_ADDRESS = "d3xLThcDtBxjpiw9MkSbK6YyCrcc1eTrWEg2b8bFHHD";

  // Use your wallet as maker (from Anchor.toml)
  const maker = provider.wallet.payer;
  const taker = new PublicKey(TAKER_ADDRESS);
  const mintA = new PublicKey(MINT_A_ADDRESS);
  const mintB = new PublicKey(MINT_B_ADDRESS);

  const makerAtaA = spl.getAssociatedTokenAddressSync(
    mintA,
    maker.publicKey,
    false,
    tokenProgram
  );
  const makerAtaB = spl.getAssociatedTokenAddressSync(
    mintB,
    maker.publicKey,
    false,
    tokenProgram
  );
  const takerAtaA = spl.getAssociatedTokenAddressSync(
    mintA,
    taker,
    false,
    tokenProgram
  );
  const takerAtaB = spl.getAssociatedTokenAddressSync(
    mintB,
    taker,
    false,
    tokenProgram
  );

  const escrow = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.publicKey.toBuffer(),
      SEED.toArrayLike(Buffer, "le", 8),
    ],
    programId
  )[0];

  const vault = spl.getAssociatedTokenAddressSync(
    mintA,
    escrow,
    true,
    tokenProgram
  );

  const accounts = {
    maker: maker.publicKey,
    taker: taker,
    mintA: mintA,
    mintB: mintB,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vault,
    tokenProgram,
  };

  it("Setup accounts", async () => {
    const tx = new anchor.web3.Transaction();

    // Create ATAs for maker and taker
    tx.instructions.push(
      ...[
        { mint: mintA, authority: maker.publicKey, ata: makerAtaA },
        { mint: mintB, authority: maker.publicKey, ata: makerAtaB },
        { mint: mintA, authority: taker, ata: takerAtaA },
        { mint: mintB, authority: taker, ata: takerAtaB },
      ].map((x) =>
        spl.createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          x.ata,
          x.authority,
          x.mint,
          tokenProgram
        )
      )
    );

    await provider.sendAndConfirm(tx, [provider.wallet.payer]).then(log);
  });

  it("Make", async () => {
    await program.methods
      .make(SEED, new anchor.BN(50000), new anchor.BN(5000000)) // 0.05 Token A for 5 Token B
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Take", async () => {
    await program.methods
      .take()
      .accounts({ ...accounts })
      .signers([provider.wallet.payer])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("Refund", async () => {
    await program.methods
      .refund()
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  // Note: Take test removed because taker needs to sign separately
  // The taker would need to run their own transaction to complete the swap

  const confirm = async (signature: string): Promise<string> => {
    const block = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature, ...block });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=devnet`
    );
    return signature;
  };
});
