import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

async function checkVaults() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Known addresses
  const makerAddress = "d1x4XoJobBcJAzWoNK2p5AB4aYkmnibdifkReiQi8rT";
  const mintA = "AWJPoHZMzLRxzbw3mtbZjAwWSxqvGpUjGNL676LFLeb2";
  const mintB = "95jWSX2bi7KLvWGtUYLx4pqdkFvoMQrU8g15eVpFewNX";
  const programId = "DzHecQ3KDv5q9jjpEYhAzgjGuwXNkzwuiZKXt5LKVkym";

  console.log("Checking vaults...");

  // Try different seeds to find the escrow
  for (let seed = 1; seed <= 10; seed++) {
    const escrow = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        new PublicKey(makerAddress).toBuffer(),
        new anchor.BN(seed).toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(programId)
    )[0];

    const vault = spl.getAssociatedTokenAddressSync(
      new PublicKey(mintA),
      escrow,
      true,
      spl.TOKEN_PROGRAM_ID
    );

    try {
      const vaultInfo = await connection.getAccountInfo(vault);
      if (vaultInfo) {
        const vaultBalance = await connection.getTokenAccountBalance(vault);
        console.log(`\nFound escrow with seed ${seed}:`);
        console.log(`Escrow: ${escrow.toString()}`);
        console.log(`Vault: ${vault.toString()}`);
        console.log(`Vault balance: ${vaultBalance.value.uiAmount} Token A`);

        // Also check escrow account
        const escrowInfo = await connection.getAccountInfo(escrow);
        if (escrowInfo) {
          console.log(
            `Escrow account exists and has ${escrowInfo.lamports} lamports`
          );
        }
      }
    } catch (e) {
      // Vault doesn't exist, continue
    }
  }
}

checkVaults().catch(console.error);
