import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Amm } from "../target/types/amm";

async function main() {
  // Configure provider for devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Use the correct program
  const program = anchor.workspace.amm as anchor.Program<Amm>;

  const user = provider.wallet.publicKey;

  // Seeds & PDAs
  const seed = new anchor.BN(12345); // must match Initialize seed

  // Token mints (your tokens)
  const mintX = new PublicKey("AWJPoHZMzLRxzbw3mtbZjAwWSxqvGpUjGNL676LFLeb2");
  const mintY = new PublicKey("95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX");

  // Derive config PDA & mint_lp PDA
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [mintLp] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), config.toBuffer()],
    program.programId
  );

  // Vault token accounts (owned by config PDA)
  const vaultX = await getAssociatedTokenAddress(mintX, config, true);
  const vaultY = await getAssociatedTokenAddress(mintY, config, true);

  // User token accounts
  const userX = await getAssociatedTokenAddress(mintX, user);
  const userY = await getAssociatedTokenAddress(mintY, user);
  const userLp = await getAssociatedTokenAddress(mintLp, user);

  // Amounts in smallest units (assuming decimals=6)
  const amountToMintLp = new anchor.BN(1_000_000); // mint 1 LP token
  const maxAmountX = new anchor.BN(100_000); // 0.1 token with 6 decimals
  const maxAmountY = new anchor.BN(10_000_000); // 10 tokens with 6 decimals

  const tx = await program.methods
    .deposit(amountToMintLp, maxAmountX, maxAmountY)
    .accounts({
      user,
      mintX,
      mintY,
      config,
      vaultX,
      vaultY,
      mintLp,
      userX,
      userY,
      userLp,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Deposit tx:", tx);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
