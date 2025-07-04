import {
  createSolanaClient,
  SolanaClusterMoniker,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  getExplorerLink,
  address,
} from "gill";

import {
  buildTransferTokensTransaction,
  //getAssociatedTokenAccountAddress,
  TOKEN_PROGRAM_ADDRESS,
} from "gill/programs/token";

import { signer } from "../wallet";

const cluster: SolanaClusterMoniker = "devnet";
const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: cluster,
});

async function main() {
  const recipientWallet = "d3xLThcDtBxjpiw9MkSbK6YyCrcc1eTrWEg2b8bFHHD";
  const mintAddress = "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";

  /*const destinationAta = await getAssociatedTokenAccountAddress(
    mintAddress,
    address(recipientWallet),
    TOKEN_PROGRAM_ADDRESS
  );*/

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const tx = await buildTransferTokensTransaction({
    feePayer: signer,
    latestBlockhash,
    mint: address(mintAddress),
    authority: signer,
    amount: 100_000,
    destination: address(recipientWallet),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
    computeUnitLimit: 40000, // Increase compute unit limit to handle ATA creation
  });

  // Sign the transaction
  const signedTx = await signTransactionMessageWithSigners(tx);
  const signature = getSignatureFromTransaction(signedTx);

  console.log(
    "Explorer link:",
    getExplorerLink({ cluster, transaction: signature })
  );

  // Send and confirm
  await sendAndConfirmTransaction(signedTx);

  console.log("Transfer complete.");
}

main().catch(console.error);
