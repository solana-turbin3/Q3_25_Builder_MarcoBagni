import bs58 from "bs58";
import promptSync from "prompt-sync";
import { Keypair } from "@solana/web3.js";

const prompt = promptSync();

// Convert base58 → byte array
function base58ToBytes() {
  const base58 = prompt("Paste your Phantom private key (base58): ");
  const bytes = bs58.decode(base58);
  console.log("Wallet secretKey bytes:", JSON.stringify(Array.from(bytes)));
}

// Convert byte array → base58
function bytesToBase58() {
  const input = prompt("Paste your wallet secretKey as byte array: ");
  const bytes = Uint8Array.from(JSON.parse(input));
  const base58 = bs58.encode(bytes);
  console.log("Phantom private key (base58):", base58);
}

// New: base58 private key → public key
function bytesToPubkey() {
  const input = prompt("Paste your private key (base58 or byte array): ");

  let bytes: Uint8Array;
  try {
    if (input.startsWith("[")) {
      // JSON-style byte array
      bytes = Uint8Array.from(JSON.parse(input));
    } else {
      // Base58-encoded string
      bytes = bs58.decode(input);
    }

    const keypair = Keypair.fromSecretKey(bytes);
    console.log("Derived Public Key:", keypair.publicKey.toBase58());
  } catch (err) {
    console.error(
      "❌ Invalid input. Make sure it's a base58 string or valid byte array."
    );
  }
}

// Run modes
const mode = prompt(
  "Choose mode (1 = base58 to Bytes, 2 = Bytes to base58, 3 = Bytes to pubkey): "
);
if (mode === "1") base58ToBytes();
else if (mode === "2") bytesToBase58();
else if (mode === "3") bytesToPubkey();
else console.log("Invalid mode.");
