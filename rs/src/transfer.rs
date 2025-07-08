use solana_client::rpc_client::RpcClient;
use solana_program::{pubkey::Pubkey, system_instruction::transfer};
use solana_sdk::{
    signature::{Signer, read_keypair_file},
    transaction::Transaction,
    hash::hash,
};
use std::str::FromStr;
use std::env;
use dotenvy::dotenv;

const RPC_URL: &str = "https://api.devnet.solana.com";

pub fn main() {
    // Load your devnet keypair from file
    dotenv().ok();
    let wallet_path = env::var("WALLET_3").expect("WALLET not set");
    let keypair = read_keypair_file(wallet_path).expect("Couldn't read keypair");
    let pubkey = keypair.pubkey();

    // Optional: sign and verify a message
    let message_bytes = b"I verify my Solana Keypair!";
    let sig = keypair.sign_message(message_bytes);
    let sig_hashed = hash(sig.as_ref());
    match sig.verify(pubkey.as_ref(), sig_hashed.as_ref()) {
        true => println!("Signature verified"),
        false => println!("Verification failed"),
    }

    // Define recipient pubkey (replace with your target public key)
    let to_pubkey = Pubkey::from_str(&env::var("WALLET_2_ADDRESS").unwrap())
        .expect("Invalid WALLET_2_ADDRESS");

    // Create RPC client
    let rpc_client = RpcClient::new(RPC_URL.to_string());

    // Get recent blockhash for transaction
    let recent_blockhash = rpc_client.get_latest_blockhash().expect("Failed to get recent blockhash");

    // Create transfer instruction (sending 1000 lamports = 0.000001 SOL)
    let transfer_instruction = transfer(&pubkey, &to_pubkey, 500_000_000);

    // Build and sign transaction
    let transaction = Transaction::new_signed_with_payer(
        &[transfer_instruction],
        Some(&pubkey),
        &[&keypair],
        recent_blockhash,
    );

    // Send and confirm transaction
    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .expect("Failed to send transaction");

    println!("Success! Check your TX here:");
    println!("https://explorer.solana.com/tx/{}?cluster=devnet", signature);
}