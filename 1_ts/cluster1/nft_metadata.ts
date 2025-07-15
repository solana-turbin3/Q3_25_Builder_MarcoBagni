import wallet from "../wallet";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    // Create metadata JSON following Metaplex standards
    const metadata = {
      name: "Turbin3 RUG 1",
      symbol: "T-rug-1",
      description: "Fresh rugs for your home",
      image:
        "https://devnet.irys.xyz/DVw7qziKMQYSz22Vka6boo54AKfy7EtvGneomJr9NE1u", // Replace with actual image URI
      attributes: [
        { trait_type: "powered", value: "rug" },
        { trait_type: "edition", value: "1" },
        { trait_type: "rarity", value: "common" },
      ],
      properties: {
        files: [
          {
            type: "image/jpeg",
            uri: "https://devnet.irys.xyz/DVw7qziKMQYSz22Vka6boo54AKfy7EtvGneomJr9NE1u", // Replace with actual image URI
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

    // Convert metadata to generic file
    const metadataFile = createGenericFile(
      Buffer.from(JSON.stringify(metadata)),
      "t-rug-1.json",
      { contentType: "application/json" }
    );

    // Upload metadata to Irys
    const [metadataUri] = await umi.uploader.upload([metadataFile]);
    console.log("✅ Metadata JSON uploaded:", metadataUri);
  } catch (error) {
    console.log("❌ Something went wrong:", error);
  }
})();
