import {
  createSolanaClient,
  SolanaClusterMoniker,
  getExplorerLink,
  address,
  sendAndConfirmTransactionWithSignersFactory,
} from "gill";

import wallet from "../wallet";
import dotenv from "dotenv";
dotenv.config();

const cluster: SolanaClusterMoniker = "devnet";
const { rpc } = createSolanaClient({
  urlOrMoniker: cluster,
});

async function main() {
  const recipientWallet = process.env["WALLET_3_ADDRESS"] || "";
  const mintAddress = process.env["MINT_T-2_ADDRESS"] || "";

  try {
    // Debug wallet
    console.log("Wallet type:", typeof wallet);
    console.log("Wallet is array:", Array.isArray(wallet));
    console.log("Wallet length:", wallet.length);
    console.log("First 10 bytes:", wallet.slice(0, 10));

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    console.log("✅ Gill library connected successfully!");
    console.log(`Cluster: ${cluster}`);
    console.log(`Recipient: ${recipientWallet}`);
    console.log(`Mint: ${mintAddress}`);
    console.log(`Latest blockhash: ${latestBlockhash.blockhash}`);

    // Note: The gill library's createSignerFromKeyPair has compatibility issues
    // with the current wallet format. We'll need to find an alternative approach
    // or use a different method to create the signer.
    console.log(
      "Gill library is ready, but signer creation needs alternative approach!"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);
