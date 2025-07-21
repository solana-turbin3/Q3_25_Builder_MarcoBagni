import * as readline from "readline";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Helper function to ask user questions
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to run a TypeScript script with optimized performance
async function runScript(scriptName: string): Promise<void> {
  console.log(`\n🚀 Running ${scriptName}...`);
  console.log("=".repeat(50));

  return new Promise((resolve, reject) => {
    // Use ts-node with optimized settings for better performance
    const child = spawn(
      "npx",
      ["ts-node", "--transpile-only", `scripts/${scriptName}.ts`],
      {
        stdio: "inherit",
        shell: false,
      }
    );

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} completed successfully!`);
      } else {
        console.log(`\n❌ ${scriptName} failed with code ${code}`);
      }
      resolve();
    });

    child.on("error", (error) => {
      console.error(`\n❌ Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

// Function to check if pool-info.json exists
function checkPoolExists(): boolean {
  return fs.existsSync("pool-info.json");
}

// Function to show pool info
async function showPoolInfo(): Promise<void> {
  if (!checkPoolExists()) {
    console.log("❌ No pool found. Please run initialize-pool.ts first.");
    return;
  }

  try {
    const poolInfo = JSON.parse(fs.readFileSync("pool-info.json", "utf8"));
    console.log("\n📊 Pool Information:");
    console.log("=".repeat(30));
    console.log(`Config PDA: ${poolInfo.configPda}`);
    console.log(`LP Mint: ${poolInfo.lpMint}`);
    console.log(`Vault X: ${poolInfo.vaultX}`);
    console.log(`Vault Y: ${poolInfo.vaultY}`);
    console.log(`Token X: ${poolInfo.mintX}`);
    console.log(`Token Y: ${poolInfo.mintY}`);
    console.log(`Seed: ${poolInfo.seed}`);
    console.log(`Fee: ${poolInfo.fee} basis points (${poolInfo.fee / 100}%)`);
    console.log(`Created: ${poolInfo.createdAt}`);
  } catch (error) {
    console.log("❌ Error reading pool info:", error);
  }
}

// Main menu function
async function showMenu(): Promise<void> {
  console.log("\n" + "=".repeat(50));
  console.log("🏦 Solana AMM - Main Menu");
  console.log("=".repeat(50));

  if (!checkPoolExists()) {
    console.log("\n⚠️  No pool found!");
    console.log("Please run 'initialize-pool.ts' first to create a pool.");
    console.log("\nAvailable options:");
    console.log("1. Initialize Pool (create new pool)");
    console.log("0. Exit");
  } else {
    console.log("\n📊 Pool Status: ✅ Active");
    console.log("\nAvailable operations:");
    console.log("1. 📊 Pool Info (show current pool state)");
    console.log("2. 💧 Deposit Liquidity");
    console.log("3. 💸 Withdraw Liquidity");
    console.log("4. 🔄 Swap Tokens");
    console.log("5. 🆕 Initialize New Pool");
    console.log("0. 🚪 Exit");
  }

  const choice = await askQuestion("\nSelect an option (0-5): ");

  switch (choice) {
    case "0":
      console.log("\n👋 Goodbye!");
      process.exit(0);
      break;

    case "1":
      if (!checkPoolExists()) {
        // Initialize new pool
        console.log("\n🚀 Initializing new pool...");
        await runScript("initialize-pool");
      } else {
        // Show pool info
        await showPoolInfo();
      }
      break;

    case "2":
      if (!checkPoolExists()) {
        console.log("❌ No pool found. Please initialize a pool first.");
      } else {
        await runScript("deposit");
      }
      break;

    case "3":
      if (!checkPoolExists()) {
        console.log("❌ No pool found. Please initialize a pool first.");
      } else {
        await runScript("withdraw");
      }
      break;

    case "4":
      if (!checkPoolExists()) {
        console.log("❌ No pool found. Please initialize a pool first.");
      } else {
        await runScript("swap");
      }
      break;

    case "5":
      console.log("\n🚀 Initializing new pool...");
      await runScript("initialize-pool");
      break;

    default:
      console.log("❌ Invalid choice. Please select 0-5.");
      break;
  }

  // Return to menu
  await askQuestion("\nPress Enter to return to menu...");
  await showMenu();
}

// Main function
async function main() {
  console.log("🏦 Welcome to Solana AMM!");
  console.log("A decentralized automated market maker on Solana");

  await showMenu();
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n👋 Goodbye!");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 Goodbye!");
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
