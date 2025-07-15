use solana_sdk::signature::{Keypair, Signer};

pub fn keygen() {
    let kp = Keypair::new();

    println!("You've generated a new Solana wallet:");
    println!("Public key: {}", kp.pubkey());
    println!("\nTo save your wallet, copy and paste the following into a JSON file:");
    println!("{:?}", kp.to_bytes());
}