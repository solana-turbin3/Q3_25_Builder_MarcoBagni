import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("Simple escrow test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const maker = Keypair.generate();
  const taker = Keypair.generate();

  beforeAll(async () => {
    // Airdrop SOL to maker and taker
    await provider.connection.requestAirdrop(maker.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(taker.publicKey, LAMPORTS_PER_SOL);
  });

  it("Can airdrop SOL", async () => {
    const balance = await provider.connection.getBalance(maker.publicKey);
    console.log("Maker balance:", balance);
    expect(balance).toBeGreaterThan(0);
  });

  it("Can create keypairs", async () => {
    const tokenA = Keypair.generate();
    const tokenB = Keypair.generate();
    console.log("Token A:", tokenA.publicKey.toString());
    console.log("Token B:", tokenB.publicKey.toString());
    expect(tokenA.publicKey).toBeDefined();
    expect(tokenB.publicKey).toBeDefined();
  });
});
