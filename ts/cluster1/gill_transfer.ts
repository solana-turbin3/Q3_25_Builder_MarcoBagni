import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import wallet from "../wallet";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");

async function main() {
  const recipientWallet = new PublicKey(
    "d3xLThcDtBxjpiw9MkSbK6YyCrcc1eTrWEg2b8bFHHD"
  );
  const mintAddress = new PublicKey(
    "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX"
  );

  try {
    // Get the sender's token account
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintAddress,
      keypair.publicKey
    );

    // Get the recipient's token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintAddress,
      recipientWallet
    );

    // Transfer tokens
    const signature = await transfer(
      connection,
      keypair,
      senderTokenAccount.address,
      recipientTokenAccount.address,
      keypair,
      100_000 // amount to transfer
    );

    console.log("✅ Transfer successful!");
    console.log(`Transaction signature: ${signature}`);
    console.log(
      `Explorer link: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (error) {
    console.error("❌ Transfer failed:", error);
  }
}

main().catch(console.error);
