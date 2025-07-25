import { Keypair } from "@solana/web3.js";
import promptSync from "prompt-sync";

const prompt = promptSync();

// Option 1: Random keypair
function generateRandom(): Keypair {
  return Keypair.generate();
}

// Option 2: Grind for prefix
function grindPrefix(prefix: string): Keypair {
  let attempts = 0;
  while (true) {
    const kp = Keypair.generate();
    attempts++;
    if (kp.publicKey.toBase58().startsWith(prefix)) {
      console.log(`\n[✓] Found match after ${attempts} attempts.`);
      return kp;
    }
    if (attempts % 10000 === 0) {
      console.log(`[ ] Tried ${attempts}... still grinding`);
    }
  }
}

// Choose mode
const mode = prompt("Choose mode (1 = random, 2 = grind): ");

let kp: Keypair;

if (mode === "1") {
  kp = generateRandom();
} else if (mode === "2") {
  const prefix = prompt("Enter grind prefix: ");
  kp = grindPrefix(prefix);
} else {
  console.log("Invalid choice.");
  process.exit(1);
}

console.log(`\nGenerated Solana wallet:
Public Key:  ${kp.publicKey.toBase58()}
Private Key: [${kp.secretKey}]
`);
