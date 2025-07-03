use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::{Keypair, Signer};
use std::env;
use dotenvy::dotenv;

const RPC_URL: &str = "https://api.devnet.solana.com";

pub fn claim_airdrop() {
    dotenv().ok();
    let wallet_path = env::var("WALLET_3").expect("WALLET_3 not set");
    let keypair = Keypair::from_base58_string(&wallet_path);

    let client = RpcClient::new(RPC_URL);

    match client.request_airdrop(&keypair.pubkey(), 1_000_000_000u64) {
        Ok(sig) => {
            println!("✅ Airdrop successful!");
            println!("🔗 https://explorer.solana.com/tx/{}?cluster=devnet", sig);
        }
        Err(err) => {
            println!("❌ Airdrop failed: {}", err);
        }
    }
}