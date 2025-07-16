import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { Escrow } from "../target/types/escrow";
import * as fs from "fs";

async function makeEscrow() {
  // Use Anchor's default provider (uses the wallet from Anchor.toml)
  const provider = anchor.AnchorProvider.env();

  // Force connection to devnet
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Create new provider with devnet connection
  const devnetProvider = new anchor.AnchorProvider(
    connection,
    provider.wallet,
    { commitment: "confirmed" }
  );

  anchor.setProvider(devnetProvider);

  const program = anchor.workspace.escrow as Program<Escrow>;
  const programId = program.programId;
  const tokenProgram = spl.TOKEN_PROGRAM_ID;

  console.log("RPC:", devnetProvider.connection.rpcEndpoint);

  const SEED = new anchor.BN(1); // Use seed 1 for consistency

  // Known addresses
  const makerAddress = "d1x4XoJobBcJAzWoNK2p5AB4aYkmnibdifkReiQi8rT";
  const takerAddress = "d3xLThcDtBxjpiw9MkSbK6YyCrcc1eTrWEg2b8bFHHD";
  const MINT_A_ADDRESS = "AWJPoHZMzLRxzbw3mtbZjAwWSxqvGpUjGNL676LFLeb2";
  const MINT_B_ADDRESS = "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";

  const maker = devnetProvider.wallet; // Use the provider's wallet
  const taker = new PublicKey(takerAddress);
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

  console.log("Executing Make instruction...");
  console.log("Maker wallet:", maker.publicKey.toString());
  console.log("Seed:", SEED.toString());
  console.log("Escrow:", escrow.toString());
  console.log("Vault:", vault.toString());

  try {
    const signature = await program.methods
      .make(SEED, new anchor.BN(499900), new anchor.BN(1000000)) // 0.4999 Token A for 1 Token B
      .accounts({ ...accounts })
      .rpc();

    console.log(`✅ Make transaction successful!`);
    console.log(
      `Signature: https://explorer.solana.com/transaction/${signature}?cluster=devnet`
    );
    console.log(`Escrow address: ${escrow.toString()}`);
    console.log(`Vault address: ${vault.toString()}`);

    // Check balances after
    console.log("\nChecking balances after Make...");
    const makerBalanceA =
      await devnetProvider.connection.getTokenAccountBalance(makerAtaA);
    const vaultBalance = await devnetProvider.connection.getTokenAccountBalance(
      vault
    );
    console.log(`Maker Token A balance: ${makerBalanceA.value.uiAmount}`);
    console.log(`Vault Token A balance: ${vaultBalance.value.uiAmount}`);
  } catch (error) {
    console.error("❌ Make transaction failed:", error);
  }
}

makeEscrow().catch(console.error);
