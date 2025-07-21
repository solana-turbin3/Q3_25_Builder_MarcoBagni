import { Connection, PublicKey } from "@solana/web3.js";

// Use a better RPC endpoint with higher rate limits
const connection = new Connection(
  "https://solana-mainnet.rpc.extrnode.com",
  "confirmed"
);

// Replace with the wallet address you want to analyze
const WALLET_ADDRESS = "E3zHh78ujEffBETguxjVnqPP9Ut42BCbbxXkdk9YQjLC";

// Helper function to add delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  try {
    console.log(`🔍 Analyzing wallet: ${WALLET_ADDRESS}`);
    console.log(`🌐 Network: Mainnet`);
    console.log(`🚀 Using improved RPC endpoint`);

    const wallet = new PublicKey(WALLET_ADDRESS);

    // Get account info
    const accountInfo = await connection.getAccountInfo(wallet);
    if (accountInfo) {
      console.log(`✅ Account exists`);
      console.log(`💰 Balance: ${accountInfo.lamports / 1e9} SOL`);
    } else {
      console.log(`❌ Account not found`);
      return;
    }

    // Get transaction history (reduced to 100 transactions to avoid rate limits)
    console.log(`\n📊 Fetching transaction history...`);
    const signatures = await connection.getSignaturesForAddress(wallet, {
      limit: 100, // Reduced from 1000 to avoid rate limits
    });

    console.log(`📈 Found ${signatures.length} transactions`);
    console.log(`🔍 Checking for onboard transactions...`);

    // Filter for "onboard" related transactions
    let onboardCount = 0;
    let totalOnboardAmount = 0;
    let processedCount = 0;

    for (const sig of signatures) {
      try {
        // Add delay between requests to avoid rate limiting
        if (processedCount > 0 && processedCount % 10 === 0) {
          console.log(
            `⏳ Processed ${processedCount}/${signatures.length} transactions...`
          );
          await delay(1000); // 1 second delay every 10 requests
        }

        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        processedCount++;

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
        console.log(`⚠️  Skipping transaction ${sig.signature}: ${e}`);
        processedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`🎯 Total onboard transactions found: ${onboardCount}`);
    console.log(`💰 Total onboard amount: ${totalOnboardAmount} SOL`);
    console.log(`📈 Transactions processed: ${processedCount}`);

    if (onboardCount === 0) {
      console.log(
        `\n💡 No onboard transactions found in the last ${signatures.length} transactions.`
      );
      console.log(
        `💡 Try increasing the limit or check a different time period.`
      );
    }
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
