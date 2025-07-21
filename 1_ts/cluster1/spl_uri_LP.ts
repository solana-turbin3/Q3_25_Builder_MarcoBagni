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
  createMetadataAccountV3,
  updateMetadataAccountV2,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// === CONFIG ===
const mintAddress = "9DQhaRJtV1zR5B4Y97khTWMu8WbJZYAL7tKJkT7pQPcC"; // your token mint
const mintAuthority = "H6pvRy1FRCxHwTvB1ZekeqUtRkvSa1gQMF3hXWa4JRyv"; // correct mint authority
const imagePath = "../img/LP_Token.jpg"; // your logo
const metadataName = "LP-MarcOlistic";
const metadataSymbol = "LP-TRB-42";
const metadataDescription = "MarcOlistic LP Token";

// If you already have uploaded image/metadata, put the URIs here to avoid re-uploading
const existingImageUri =
  "https://gateway.irys.xyz/CSQXi1H7ULX3wqMPQFQRCYeWiK6yZbRcvthLcsubhBMX";
const existingMetadataUri =
  "https://gateway.irys.xyz/5gXYFFt4J5DW1BxD2pxZGn3pBKv7NRSQDN9r6itghz2";

(async () => {
  // 1. Init UMI and signer for the mint authority
  const umi = createUmi("https://api.devnet.solana.com");
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));
  umi.use(irysUploader());

  // 2. Upload image (skip if already uploaded)
  let imageUri = existingImageUri;
  if (!imageUri) {
    const imageBytes = fs.readFileSync(imagePath);
    const imageFile = createGenericFile(imageBytes, "LP_Token.jpg", {
      contentType: "image/jpeg",
    });
    const uploadedImage = await umi.uploader.upload([imageFile]);
    imageUri = Array.isArray(uploadedImage) ? uploadedImage[0] : uploadedImage;
    console.log("✅ Image uploaded:", imageUri);
  } else {
    console.log("ℹ️  Using existing image URI:", imageUri);
  }

  // 3. Create metadata JSON (skip upload if already uploaded)
  let metadataUri = existingMetadataUri;
  if (!metadataUri) {
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
    const uploadedMetadata = await umi.uploader.upload([metadataFile]);
    metadataUri = Array.isArray(uploadedMetadata)
      ? uploadedMetadata[0]
      : uploadedMetadata;
    console.log("✅ Metadata JSON uploaded:", metadataUri);
  } else {
    console.log("ℹ️  Using existing metadata URI:", metadataUri);
  }

  // 4. Create metadata account if it does not exist (minimal fields)
  if (!mintAddress) {
    throw new Error("MINT_T_1_ADDRESS is not set in your .env file");
  }
  const mint = publicKey(mintAddress);
  // Log the data being sent
  const createData = {
    mint,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: signer,
    data: {
      name: metadataName,
      symbol: metadataSymbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 500,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  };
  console.log(
    "\n=== createMetadataAccountV3 DATA ===\n",
    JSON.stringify(createData, null, 2)
  );
  // Remove try/catch so we see the real error
  const tx = createMetadataAccountV3(umi, createData);
  const result = await tx.sendAndConfirm(umi);
  console.log("✅ Metadata account created:", bs58.encode(result.signature));

  // If you want to try update after, uncomment below:
  /*
  const metadata = findMetadataPda(umi, { mint });
  const updateData = {
    metadata,
    data: some({
      name: metadataName,
      symbol: metadataSymbol,
      uri: metadataUri,
      sellerFeeBasisPoints: 500,
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
  };
  console.log("\n=== updateMetadataAccountV2 DATA ===\n", JSON.stringify(updateData, null, 2));
  const tx2 = await updateMetadataAccountV2(umi, updateData);
  const result2 = await tx2.sendAndConfirm(umi);
  console.log("✅ On-chain metadata updated:", bs58.encode(result2.signature));
  */
})();
