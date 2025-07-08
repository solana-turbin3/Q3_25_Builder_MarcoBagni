import * as web3 from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL } from "./programs/wba_vault.ts";
import wallet from "../wallet.ts";
// Import our keypair from the wallet file
const keypair = web3.Keypair.fromSecretKey(new Uint8Array(wallet));
// Commitment
const commitment = "confirmed";
// Create a devnet connection
const connection = new web3.Connection("https://api.devnet.solana.com");
// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
    commitment,
});
// Create our program
const program = new Program(IDL, new web3.PublicKey("D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o"), provider);
// Create a random keypair for vault state
const vaultState = web3.Keypair.generate();
console.log(`Vault State public key: ${vaultState.publicKey.toBase58()}`);
// Execute our initialization transaction
(async () => {
    try {
        // Derive the vaultAuth PDA
        const [vaultAuth] = web3.PublicKey.findProgramAddressSync([Buffer.from("auth"), vaultState.publicKey.toBuffer()], program.programId);
        console.log(`Vault Auth PDA: ${vaultAuth.toBase58()}`);
        // Derive the vault PDA
        const [vault] = web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), vaultAuth.toBuffer()], program.programId);
        console.log(`Vault PDA: ${vault.toBase58()}`);
        console.log(" Initializing vault...");
        // Call the initialize instruction
        const signature = await program.methods
            .initialize()
            .accounts({
            owner: keypair.publicKey,
            vaultState: vaultState.publicKey,
            vaultAuth: vaultAuth,
            vault: vault,
            systemProgram: web3.SystemProgram.programId,
        })
            .signers([keypair, vaultState])
            .rpc();
        console.log(`✅ Vault initialized successfully!`);
        console.log(`🔗 Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
        console.log(`📊 Vault State: ${vaultState.publicKey.toBase58()}`);
        console.log(`🔐 Vault Auth: ${vaultAuth.toBase58()}`);
        console.log(`🏦 Vault: ${vault.toBase58()}`);
    }
    catch (e) {
        console.error(`❌ Error initializing vault: ${e}`);
    }
})();
