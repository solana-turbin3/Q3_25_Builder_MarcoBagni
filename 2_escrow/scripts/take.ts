import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { Escrow } from "../target/types/escrow";

async function takeEscrow() {
  // Use Anchor's default provider (uses the d3x wallet from Anchor.toml)
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

  // Known addresses from the escrow created by d1x
  const makerAddress = "d1x4XoJobBcJAzWoNK2p5AB4aYkmnibdifkReiQi8rT";
  const mintA = "AWJPoHZMzLRxzbw3mtbZjAwWSxqvGpUjGNL676LFLeb2";
  const mintB = "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";

  // Known escrow and vault addresses from the Make operation
  const escrowAddress = "DB1PSqCiq7gbWUvPMEWKUVKNL9bARKUyw3B4vrRgdxbR";
  const vaultAddress = "CcLmEp1b7pxFkddxRVbAUY5AUEpG3EdzSuKSr1V5jLH3";

  const maker = new PublicKey(makerAddress);
  const taker = devnetProvider.wallet; // Use the provider wallet as taker
  const mintAPubkey = new PublicKey(mintA);
  const mintBPubkey = new PublicKey(mintB);

  const makerAtaA = spl.getAssociatedTokenAddressSync(
    mintAPubkey,
    maker,
    false,
    tokenProgram
  );
  const makerAtaB = spl.getAssociatedTokenAddressSync(
    mintBPubkey,
    maker,
    false,
    tokenProgram
  );
  const takerAtaA = spl.getAssociatedTokenAddressSync(
    mintAPubkey,
    taker.publicKey,
    false,
    tokenProgram
  );
  const takerAtaB = spl.getAssociatedTokenAddressSync(
    mintBPubkey,
    taker.publicKey,
    false,
    tokenProgram
  );

  const escrow = new PublicKey(escrowAddress);
  const vault = new PublicKey(vaultAddress);

  const accounts = {
    maker: maker,
    taker: taker.publicKey,
    mintA: mintAPubkey,
    mintB: mintBPubkey,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vault,
    tokenProgram,
  };

  console.log("Executing Take instruction...");
  console.log("Taker wallet:", taker.publicKey.toString());
  console.log("Escrow:", escrow.toString());
  console.log("Vault:", vault.toString());

  try {
    const signature = await program.methods
      .take()
      .accounts({ ...accounts })
      .rpc();

    console.log(`✅ Take transaction successful!`);
    console.log(
      `Signature: https://explorer.solana.com/transaction/${signature}?cluster=devnet`
    );

    // Check balances after
    console.log("\nChecking balances after Take...");
    const takerBalanceA =
      await devnetProvider.connection.getTokenAccountBalance(takerAtaA);
    const takerBalanceB =
      await devnetProvider.connection.getTokenAccountBalance(takerAtaB);
    console.log(`Taker Token A balance: ${takerBalanceA.value.uiAmount}`);
    console.log(`Taker Token B balance: ${takerBalanceB.value.uiAmount}`);
  } catch (error) {
    console.error("❌ Take transaction failed:", error);
  }
}

takeEscrow().catch(console.error);
