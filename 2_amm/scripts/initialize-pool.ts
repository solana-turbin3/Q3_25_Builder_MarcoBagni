import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  getOrCreateAssociatedTokenAccount,
  getMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import * as fs from "fs";
import { homedir } from "os";

async function main() {
  // Set environment variables if not already set
  if (!process.env.ANCHOR_PROVIDER_URL) {
    process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
  }
  if (!process.env.ANCHOR_WALLET) {
    process.env.ANCHOR_WALLET = homedir() + "/.config/solana/d1x.json";
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.amm;
  const connection = provider.connection;
  const admin = provider.wallet;

  // === USER: SET YOUR TOKEN MINT ADDRESSES HERE ===
  const ADDRESS_A = "AWJPoHZMzLRxzbw3mtbZjAwWSxqvGpUjGNL676LFLeb2";
  const ADDRESS_B = "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";
  // ===============================================
  const mintX = new anchor.web3.PublicKey(ADDRESS_A);
  const mintY = new anchor.web3.PublicKey(ADDRESS_B);

  // === USER: SET INITIAL LIQUIDITY AMOUNTS ===
  const TOKEN_A_AMOUNT = 0.1; // 0.1 tokens of A
  const TOKEN_B_AMOUNT = 11; // 11 tokens of B
  // Convert to smallest units (assuming 6 decimals)
  const TOKEN_A_AMOUNT_RAW = Math.floor(TOKEN_A_AMOUNT * 1_000_000);
  const TOKEN_B_AMOUNT_RAW = Math.floor(TOKEN_B_AMOUNT * 1_000_000);
  // ===============================================

  console.log("🚀 Initializing AMM Pool...");
  console.log("Admin:", admin.publicKey.toString());
  console.log("Program ID:", program.programId.toString());
  console.log("Token X Mint:", mintX.toString());
  console.log("Token Y Mint:", mintY.toString());

  // Pool configuration
  const seed = new BN(42);
  const fee = 30; // 0.3%

  // Derive PDAs
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [lpMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), configPda.toBuffer()],
    program.programId
  );

  const vaultX = await getAssociatedTokenAddress(mintX, configPda, true);
  const vaultY = await getAssociatedTokenAddress(mintY, configPda, true);

  console.log("\n📍 Pool Addresses:");
  console.log("Config PDA:", configPda.toString());
  console.log("LP Mint:", lpMint.toString());
  console.log("Vault X:", vaultX.toString());
  console.log("Vault Y:", vaultY.toString());

  // Initialize the pool
  console.log("\n⚡ Initializing pool...");
  const tx = await program.methods
    .initialize(seed, fee, null)
    .accounts({
      admin: admin.publicKey,
      mintX,
      mintY,
      config: configPda,
      mintLp: lpMint,
      vaultX,
      vaultY,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Pool initialized successfully!");
  console.log(
    "Transaction:",
    `https://explorer.solana.com/tx/${tx}?cluster=devnet`
  );

  // Add initial liquidity to establish the price ratio
  console.log("\n💧 Adding initial liquidity...");
  console.log(`Token A: ${TOKEN_A_AMOUNT} (${TOKEN_A_AMOUNT_RAW} raw units)`);
  console.log(`Token B: ${TOKEN_B_AMOUNT} (${TOKEN_B_AMOUNT_RAW} raw units)`);

  // Get user token accounts
  const userAtaX = await getOrCreateAssociatedTokenAccount(
    connection,
    admin.payer,
    mintX,
    admin.publicKey
  );

  const userAtaY = await getOrCreateAssociatedTokenAccount(
    connection,
    admin.payer,
    mintY,
    admin.publicKey
  );

  const userLpAta = await getOrCreateAssociatedTokenAccount(
    connection,
    admin.payer,
    lpMint,
    admin.publicKey
  );

  // Calculate LP tokens using geometric mean for first deposit
  // This establishes a proper initial LP token supply
  const lpTokensToMint = Math.floor(
    Math.sqrt(TOKEN_A_AMOUNT_RAW * TOKEN_B_AMOUNT_RAW)
  );
  console.log(`LP Tokens to mint: ${lpTokensToMint} (geometric mean)`);

  const depositTx = await program.methods
    .deposit(
      new BN(lpTokensToMint),
      new BN(TOKEN_A_AMOUNT_RAW),
      new BN(TOKEN_B_AMOUNT_RAW)
    )
    .accounts({
      user: admin.publicKey,
      mintX,
      mintY,
      config: configPda,
      mintLp: lpMint,
      vaultX,
      vaultY,
      userAtaX: userAtaX.address,
      userAtaY: userAtaY.address,
      userAtaLp: userLpAta.address,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Initial liquidity added!");
  console.log(
    "Deposit Transaction:",
    `https://explorer.solana.com/tx/${depositTx}?cluster=devnet`
  );

  // Save pool info to file for other scripts
  const poolInfo = {
    configPda: configPda.toString(),
    lpMint: lpMint.toString(),
    vaultX: vaultX.toString(),
    vaultY: vaultY.toString(),
    mintX: mintX.toString(),
    mintY: mintY.toString(),
    seed: seed.toNumber(),
    fee,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync("pool-info.json", JSON.stringify(poolInfo, null, 2));
  console.log("\n💾 Pool info saved to pool-info.json");

  // === LP TOKEN METADATA ===
  const lpMintInfo = await getMint(connection, lpMint);
  console.log("\n🏷️  LP Token Metadata:");
  console.log("LP Mint Address:", lpMint.toString());
  console.log("Decimals:", lpMintInfo.decimals);
  console.log("Supply:", lpMintInfo.supply.toString());
  console.log(
    "Mint Authority:",
    lpMintInfo.mintAuthority?.toString() || "None"
  );
  console.log(
    "Freeze Authority:",
    lpMintInfo.freezeAuthority?.toString() || "None"
  );

  console.log("\n🎯 Pool ready for deposits and swaps!");
}

main().catch(console.error);
