import wallet from "../wallet.ts";
import * as fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
  some,
  publicKey,
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
const mintAddress = process.env.MINT_NFT_2_ADDRESS;
const imagePath = "./img/rugM-2.jpg"; // Updated to use rug image
const metadataName = "Turbin3 RUG 2";
const metadataSymbol = "T-rug-2";
const metadataDescription = "Fresh rugs for your home";

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
    const imageFile = createGenericFile(imageBytes, "rugM-2.jpg", {
      contentType: "image/jpeg",
    });
    const uploadedImage = await umi.uploader.upload([imageFile]);
    const imageUri = Array.isArray(uploadedImage)
      ? uploadedImage[0]
      : uploadedImage;
    console.log("✅ Image uploaded:", imageUri);

    // 3. Create metadata JSON (using RUG format from nft_metadata.ts)
    const metadataJson = {
      name: metadataName,
      symbol: metadataSymbol,
      description: metadataDescription,
      image: imageUri,
      attributes: [
        { trait_type: "powered", value: "rug" },
        { trait_type: "edition", value: "1" },
        { trait_type: "rarity", value: "common" },
      ],
      properties: {
        files: [
          {
            type: "image/jpeg",
            uri: imageUri,
          },
        ],
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
      "t-rug-2.json",
      { contentType: "application/json" }
    );

    // 4. Upload JSON
    const uploadedMetadata = await umi.uploader.upload([metadataFile]);
    const metadataUri = Array.isArray(uploadedMetadata)
      ? uploadedMetadata[0]
      : uploadedMetadata;
    console.log("✅ Metadata JSON uploaded:", metadataUri);

    // 5. Update on-chain metadata
    const mint = publicKey(mintAddress);
    const metadata = findMetadataPda(umi, { mint });
    const tx = await updateMetadataAccountV2(umi, {
      metadata,
      data: some({
        name: metadataName,
        symbol: metadataSymbol,
        uri: metadataUri,
        sellerFeeBasisPoints: 1,
        creators: some([
          {
            address: signer.publicKey,
            verified: true,
            share: 100,
          },
        ]),
        collection: null,
        uses: null,
      }),
      isMutable: some(true),
    });

    const result = await tx.sendAndConfirm(umi);
    console.log("✅ On-chain metadata updated:", bs58.encode(result.signature));
  } catch (e) {
    console.error("❌ Failed:", e);
  }
})();
