import { Connection, PublicKey } from "@solana/web3.js";

// Use official Solana RPC with better configuration
const connection = new Connection("https://api.mainnet-beta.solana.com", {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60000,
});

// Replace with the wallet address you want to analyze
const WALLET_ADDRESS = "E3zHh78ujEffBETguxjVnqPP9Ut42BCbbxXkdk9YQjLC";

// Helper function to add delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  try {
    console.log(`🔍 Analyzing wallet: ${WALLET_ADDRESS}`);
    console.log(`🌐 Network: Mainnet`);
    console.log(`⏱️  Using rate limiting to avoid 429 errors`);

    const wallet = new PublicKey(WALLET_ADDRESS);

    // Get account info
    console.log(`\n📊 Getting account info...`);
    const accountInfo = await connection.getAccountInfo(wallet);
    if (accountInfo) {
      console.log(`✅ Account exists`);
      console.log(`💰 Balance: ${accountInfo.lamports / 1e9} SOL`);
    } else {
      console.log(`❌ Account not found`);
      return;
    }

    // Get transaction history (reduced to 50 transactions to avoid rate limits)
    console.log(`\n📊 Fetching transaction history...`);
    const signatures = await connection.getSignaturesForAddress(wallet, {
      limit: 50, // Reduced to avoid rate limits
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
        if (processedCount > 0) {
          await delay(2000); // 2 second delay between each request
        }

        console.log(
          `⏳ Processing transaction ${processedCount + 1}/${
            signatures.length
          }...`
        );

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
        await delay(3000); // Extra delay on error
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
      console.log(`💡 This could mean:`);
      console.log(`   - No onboard transactions in recent history`);
      console.log(
        `   - Onboard transactions are older than the last ${signatures.length} transactions`
      );
      console.log(`   - Different terminology is used in the logs`);
    }
  } catch (e) {
    console.error("❌ Error:", e);
  }
})();
