use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    message::Message,
    signature::{read_keypair_file, Signer},
    system_instruction::transfer,
    transaction::Transaction,
    pubkey::Pubkey,
};
use std::str::FromStr;
use std::env;
use dotenvy::dotenv;

const RPC_URL: &str = "https://api.devnet.solana.com";

pub fn drain_wallet() {
    // Load sender wallet
    dotenv().ok();
    let wallet_path = env::var("WALLET_3").expect("WALLET not set");
    let keypair = read_keypair_file(wallet_path).expect("Couldn't read keypair");
    let pubkey = keypair.pubkey();

    // Destination address
    let to_pubkey = Pubkey::from_str(&env::var("WALLET_1_ADDRESS").unwrap_or_else(|_| "YOUR_WALLET_ADDRESS_HERE".to_string())).expect("Invalid pubkey");

    // RPC client
    let rpc = RpcClient::new(RPC_URL.to_string());

    // Get balance
    let balance = rpc.get_balance(&pubkey).expect("Failed to get balance");

    // Get recent blockhash
    let recent_blockhash = rpc.get_latest_blockhash().expect("Failed to get blockhash");

    // Mock message to estimate fee
    let mock_message = Message::new_with_blockhash(
        &[transfer(&pubkey, &to_pubkey, balance)],
        Some(&pubkey),
        &recent_blockhash,
    );

    // Estimate fee
    let fee = rpc.get_fee_for_message(&mock_message).expect("Failed to estimate fee");

    // Final transaction with adjusted amount
    let final_tx = Transaction::new_signed_with_payer(
        &[transfer(&pubkey, &to_pubkey, balance - fee)],
        Some(&pubkey),
        &[&keypair],
        recent_blockhash,
    );

    // Send and confirm
    let sig = rpc
        .send_and_confirm_transaction(&final_tx)
        .expect("Failed to send transaction");

    println!(
        "Success! Entire balance transferred:\nhttps://explorer.solana.com/tx/{}?cluster=devnet",
        sig
    );
}