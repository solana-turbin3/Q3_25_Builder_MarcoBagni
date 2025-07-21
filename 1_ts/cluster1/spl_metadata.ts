import wallet from "../wallet.ts";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  findMetadataPda,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define Mint address
const mint = publicKey("9DQhaRJtV1zR5B4Y97khTWMu8WbJZYAL7tKJkT7pQPcC");

// Set up UMI
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signer));

(async () => {
  try {
    const metadata = findMetadataPda(umi, { mint });

    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint,
      metadata,
      mintAuthority: signer,
      payer: signer,
    };

    const data: DataV2Args = {
      name: "LP-MarcOlistic",
      symbol: "LP-TRB-MarcOlistic",
      uri: "https://aerwave.io",
      sellerFeeBasisPoints: 1,
      creators: [
        {
          address: signer.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };

    const args: CreateMetadataAccountV3InstructionArgs = {
      data,
      isMutable: true,
      collectionDetails: null,
    };

    const tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    const result = await tx.sendAndConfirm(umi);
    console.log("Signature:", bs58.encode(result.signature));
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
