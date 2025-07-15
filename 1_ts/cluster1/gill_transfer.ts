import {
  createSolanaClient,
  getExplorerLink,
  address,
  getSignatureFromTransaction,
  signTransactionMessageWithSigners,
} from "gill";
import { buildTransferTokensTransaction } from "gill/programs/token";
import { loadKeypairSignerFromEnvironment } from "gill/node";

import wallet from "../wallet.ts";
import dotenv from "dotenv";
dotenv.config();

const cluster = "devnet";
const { rpc } = createSolanaClient({
  urlOrMoniker: cluster,
});

async function main() {
  const recipientWallet = process.env["WALLET_3_ADDRESS"];
  const mintAddress = process.env["MINT_T_2_ADDRESS"];

  try {
    // Convert wallet bytes to JSON array format
    const walletBytes = new Uint8Array(wallet);
    const walletJson = JSON.stringify(Array.from(walletBytes));

    // Set environment variable
    process.env.WALLET_BYTES_JSON = walletJson;

    // Load signer from environment
    const signer = await loadKeypairSignerFromEnvironment("WALLET_BYTES_JSON");

    console.log("✅ Gill library connected successfully!");
    console.log(`Cluster: ${cluster}`);
    console.log(`Recipient (Wallet 2): ${recipientWallet}`);
    console.log(`Mint: ${mintAddress}`);
    console.log(`Signer address: ${signer.address}`);

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    console.log(`Latest blockhash: ${latestBlockhash.blockhash}`);

    // Build transfer transaction using gill's token builder
    const transferTx = await buildTransferTokensTransaction({
      feePayer: signer,
      latestBlockhash,
      mint: address(mintAddress),
      authority: signer,
      amount: 1_000_000, // 1 token with 6 decimals
      destination: address(recipientWallet),
    });

    console.log("📝 Transaction built successfully");
    console.log("🔐 Signing transaction...");

    // Sign the transaction using gill's signing function
    const signedTx = await signTransactionMessageWithSigners(transferTx, [
      signer,
    ]);

    console.log("📤 Sending transaction...");

    // Send and confirm the transaction
    const result = await rpc.sendAndConfirmTransaction(signedTx);

    // Extract the signature properly
    const signature = getSignatureFromTransaction(signedTx);

    console.log(`✅ Transfer successful! Sent 1 token to Wallet 2`);
    console.log(`Signature: ${signature}`);
    console.log(
      `Explorer link: ${getExplorerLink({ transaction: signature, cluster })}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Error details:", error.message);
  }
}

main().catch(console.error);
