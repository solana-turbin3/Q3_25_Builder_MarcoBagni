import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplTokenMetadata,
  getMplTokenMetadataProgramId,
} from "@metaplex-foundation/mpl-token-metadata";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

// Load the token metadata program to get its ID
umi.use(mplTokenMetadata());

(async () => {
  try {
    console.log("🔍 Solana Token Ecosystem Overview");
    console.log("==================================");

    // Get the legacy Metaplex Token Metadata program ID from the library
    const legacyMetaplexProgramId = getMplTokenMetadataProgramId(umi);

    // Comprehensive token program addresses
    const TOKEN_PROGRAMS = {
      // Core Token Programs
      SPL_TOKEN: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      TOKEN_2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",

      // Metaplex Programs
      LEGACY_METAPLEX: legacyMetaplexProgramId,
      CORE: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",

      // Associated Token Account Program
      ATA_PROGRAM: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",

      // Utility Programs
      MEMO: "MemoSq4gqABAXKb96qnH8TysNcWxSkWC88fxkFDX7k",
    };

    console.log("\n🔄 Solana Frameworks:");
    console.log("=====================");
    console.log("• @solana/web3.js: Low-level Solana JavaScript API");
    console.log(
      "• @coral-xyz/anchor: Framework for Solana program development"
    );
    console.log("• @gumdrop/gill: Gill framework for Solana development");
    console.log("• @solana/wallet-adapter: Wallet connection utilities");
    console.log("• @solana/spl-token: SPL Token utilities and helpers");
    console.log("• @metaplex-foundation/js: Legacy Metaplex JavaScript SDK");
    console.log(
      "• @metaplex-foundation/umi: Modern, type-safe Metaplex framework (best for NFTs)"
    );

    console.log("\n📋 Token Program Addresses:");
    console.log("============================");
    Object.entries(TOKEN_PROGRAMS).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });

    console.log("\n💡 Program Descriptions:");
    console.log("=======================");
    console.log(
      "• SPL_TOKEN: Standard Solana token program for fungible tokens"
    );
    console.log(
      "• TOKEN_2022: Enhanced token program with additional features (confidential transfers, etc.)"
    );
    console.log(
      "• LEGACY_METAPLEX: Original Token Metadata program, still widely used"
    );
    console.log("• CORE: New Metaplex program for enhanced NFT functionality");
    console.log(
      "• ATA_PROGRAM: Program for creating deterministic token accounts (ATAs)"
    );
    console.log(
      "• ATA: Deterministic token account derived from wallet + mint via ATA program"
    );
    console.log("• TA: General-purpose token account, can be manual/non-PDA");
    console.log("• MEMO: Program for adding memos to transactions");

    console.log("\n🔗 PDA (Program Derived Address) Connections:");
    console.log("===========================================");
    console.log("• ATA Program: Creates deterministic token accounts");
    console.log(
      "• ATA: Derived from wallet + mint via ATA program (deterministic)"
    );
    console.log("• TA: General token account (can be non-deterministic)");
    console.log("• Metadata Accounts: Derived from mint + metadata program");
    console.log(
      "• Master Editions: Derived from mint + metadata program + 'edition'"
    );
    console.log(
      "• Collection Authorities: Derived from collection + authority program"
    );
    console.log("• Edition Markers: Derived from mint + edition + marker");

    console.log("\n📦 UMI Framework Context:");
    console.log("=========================");
    console.log(
      "• UMI (Universal Metaplex Interface): Modern framework for Solana development"
    );
    console.log(
      "• Provides type-safe program interactions and simplified APIs"
    );
    console.log(
      "• Handles program registration and address resolution automatically"
    );
    console.log("• Available programs via UMI (Metaplex ecosystem):");
    console.log(
      `  - Associated Token: ${
        umi.programs.get("splAssociatedToken").publicKey
      }`
    );
    console.log(
      `  - Token Metadata: ${umi.programs.get("mplTokenMetadata").publicKey}`
    );
    console.log(
      "• Note: UMI wraps Metaplex programs, but SPL Token operations use web3.js + spl-token directly"
    );

    console.log("\n🔍 Key Differences:");
    console.log("==================");
    console.log(
      "• SPL_TOKEN vs TOKEN_2022: Standard vs enhanced token features"
    );
    console.log(
      "• LEGACY_METAPLEX vs CORE: Original vs new NFT metadata handling"
    );
    console.log("• UMI vs Web3.js: High-level vs low-level programming");
    console.log("• ATA vs TA: Deterministic vs general token accounts");
    console.log("• Web3.js: Current standard for SPL token operations");
    console.log(
      "• Gill vs Kit vs Web3.js: Alternative vs official vs standard approaches"
    );

    console.log("\n🚀 Framework Use Cases:");
    console.log("======================");
    console.log(
      "• SPL Token: Best for basic token operations, fungible tokens"
    );
    console.log(
      "• Web3.js: Best for learning, low-level control, SPL token operations"
    );
    console.log("• Gill: Best for specific use cases, alternative approach");
    console.log(
      "• UMI: Best for NFT development, Metaplex ecosystem, type safety"
    );
    console.log("• Anchor: Best for custom program development, complex DeFi");
  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
