import wallet from "../wallet.ts";
import * as fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
  some,
  publicKey,
  none,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  updateMetadataAccountV2,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// === CONFIG ===
const mintAddress = "9DQhaRJtV1zR5B4Y97khTWMu8WbJZYAL7tKJkT7pQPcC"; // your token mint
const imagePath = "../img/LP_Token.jpg"; // your logo
const metadataName = "LP-MarcOlistic";
const metadataSymbol = "LP-TRB-42";
const metadataDescription = "MarcOlistic LP Token";

(async () => {
  // 1. Init UMI and signer
  const umi = createUmi("https://api.devnet.solana.com");
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));
  umi.use(irysUploader());

  try {
    // 2. Upload image
    const imageBytes = fs.readFileSync(imagePath);
    const imageFile = createGenericFile(imageBytes, "LP_Token.jpg", {
      contentType: "image/jpeg",
    });
    const uploadedImage = await umi.uploader.upload([imageFile]);
    const imageUri = Array.isArray(uploadedImage)
      ? uploadedImage[0]
      : uploadedImage;
    console.log("✅ Image uploaded:", imageUri);

    // 3. Create metadata JSON
    const metadataJson = {
      name: metadataName,
      symbol: metadataSymbol,
      description: metadataDescription,
      image: imageUri,
      attributes: [
        { trait_type: "pool", value: "Turbin3" },
        { trait_type: "cool", value: "100" },
        { trait_type: "fool", value: "1" },
      ],
      properties: {
        files: [{ uri: imageUri, type: "image/jpeg" }],
        category: "image",
      },
      creators: [
        {
          address: signer.publicKey.toString(),
          share: 100,
        },
      ],
    };
    const metadataFile = createGenericFile(
      Buffer.from(JSON.stringify(metadataJson)),
      "tokenAW-1.json",
      { contentType: "application/json" }
    );

    // 4. Upload JSON
    const uploadedMetadata = await umi.uploader.upload([metadataFile]);
    const metadataUri = Array.isArray(uploadedMetadata)
      ? uploadedMetadata[0]
      : uploadedMetadata;
    console.log("✅ Metadata JSON uploaded:", metadataUri);

    // 5. Update on-chain metadata
    if (!mintAddress) {
      throw new Error("MINT_T_1_ADDRESS is not set in your .env file");
    }
    const mint = publicKey(mintAddress);
    const metadata = findMetadataPda(umi, { mint });
    const tx = await updateMetadataAccountV2(umi, {
      metadata,
      data: some({
        name: metadataName,
        symbol: metadataSymbol,
        uri: metadataUri,
        sellerFeeBasisPoints: 500, // 5% (use 0 if you want no royalties)
        creators: some([
          {
            address: signer.publicKey,
            verified: true,
            share: 100,
          },
        ]),
        collection: none(),
        uses: none(),
      }),
      isMutable: some(true),
    });

    const result = await tx.sendAndConfirm(umi);
    console.log("✅ On-chain metadata updated:", bs58.encode(result.signature));
  } catch (e) {
    console.error("❌ Failed:", e);
  }
})();
