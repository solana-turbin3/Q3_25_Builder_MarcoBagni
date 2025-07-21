import { Connection, PublicKey } from "@solana/web3.js";

// Connect to mainnet
const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// Replace with the wallet address you want to analyze
const WALLET_ADDRESS = "E3zHh78ujEffBETguxjVnqPP9Ut42BCbbxXkdk9YQjLC";

(async () => {
  try {
    console.log(`🔍 Analyzing wallet: ${WALLET_ADDRESS}`);
    console.log(`🌐 Network: Mainnet`);

    const wallet = new PublicKey(WALLET_ADDRESS);

    // Get account info
    const accountInfo = await connection.getAccountInfo(wallet);
    if (accountInfo) {
      console.log(`✅ Account exists`);
      console.log(` Balance: ${accountInfo.lamports / 1e9} SOL`);
    } else {
      console.log(`❌ Account not found`);
      return;
    }

    // Get transaction history (last 1000 transactions)
    console.log(`\n📊 Fetching transaction history...`);
    const signatures = await connection.getSignaturesForAddress(wallet, {
      limit: 1000,
    });

    console.log(` Found ${signatures.length} transactions`);

    // Filter for "onboard" related transactions
    let onboardCount = 0;
    let totalOnboardAmount = 0;

    for (const sig of signatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx && tx.meta) {
          // Look for "onboard" in transaction logs
          const logs = tx.meta.logMessages || [];
          const hasOnboard = logs.some((log) =>
            log.toLowerCase().includes("onboard")
          );

          if (hasOnboard) {
            onboardCount++;
            console.log(`\n🎯 Onboard transaction found:`);
            console.log(`   Signature: ${sig.signature}`);
            console.log(`   Block: ${sig.slot}`);
            console.log(
              `   Date: ${new Date(sig.blockTime! * 1000).toISOString()}`
            );

            // Try to extract amount if it's a transfer
            if (tx.meta.preBalances && tx.meta.postBalances) {
              const balanceChange =
                (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9;
              if (balanceChange > 0) {
                totalOnboardAmount += balanceChange;
                console.log(`   Amount received: ${balanceChange} SOL`);
              }
            }
          }
        }
      } catch (e) {
        // Skip failed transaction fetches
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`🎯 Total onboard transactions: ${onboardCount}`);
    console.log(`💰 Total onboard amount: ${totalOnboardAmount} SOL`);
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
