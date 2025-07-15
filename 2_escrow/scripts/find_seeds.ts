import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

function findSeed() {
  const makerAddress = "d1x4XoJobBcJAzWoNK2p5AB4aYkmnibdifkReiQi8rT";
  const programId = "DzHecQ3KDv5q9jjpEYhAzgjGuwXNkzwuiZKXt5LKVkym";
  const knownEscrow = "2Xve5HQC1E5eCjjh9oe9VGvQA4cXWrdXtzmrQFNKXD7N";

  console.log("Finding the correct seed...");
  console.log(`Known escrow: ${knownEscrow}`);

  // Try different seeds
  for (let seed = 1; seed <= 1000; seed++) {
    const escrow = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        new PublicKey(makerAddress).toBuffer(),
        new anchor.BN(seed).toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(programId)
    )[0];

    if (escrow.toString() === knownEscrow) {
      console.log(`\nFound the correct seed: ${seed}`);
      console.log(`Escrow: ${escrow.toString()}`);
      return seed;
    }
  }

  console.log("Seed not found in range 1-1000");
  return null;
}

findSeed();
