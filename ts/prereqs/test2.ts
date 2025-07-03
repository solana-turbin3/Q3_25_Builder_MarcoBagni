import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const pdaPubkey = new PublicKey("ATLjfK6drvdyCgWBwRBh6JnUHamXE7ws5ESc8WJhVrdC");

async function checkBalance() {
  try {
    const balance = await connection.getBalance(pdaPubkey);
    console.log(`PDA balance: ${balance} lamports`);
  } catch (error) {
    console.error("Failed to get balance:", error);
  }
}

checkBalance();
