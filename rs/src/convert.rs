use bs58;
use std::io::{self, BufRead};
use solana_sdk::signature::{Keypair, Signer};

fn base58_to_wallet() {
    println!("Input your private key as a base58 string:");
    let stdin = io::stdin();
    let base58 = stdin.lock().lines().next().unwrap().unwrap();

    let wallet = bs58::decode(base58).into_vec().unwrap();

    println!("Your wallet file format is:");
    println!("{:?}", wallet);
}

fn wallet_to_base58() {
    println!("Input your private key as a JSON byte array (e.g. [12,34,...]):");
    let stdin = io::stdin();
    let input = stdin.lock().lines().next().unwrap().unwrap();

    let wallet = input
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split(',')
        .map(|s| s.trim().parse::<u8>().unwrap())
        .collect::<Vec<u8>>();

    let base58 = bs58::encode(wallet).into_string();

    println!("Your Base58-encoded private key is:");
    println!("{}", base58);
}

fn wallet_bytes_to_pubkey() {
    println!("Input your private key as a JSON byte array (e.g. [12,34,...]):");
    let stdin = io::stdin();
    let input = stdin.lock().lines().next().unwrap().unwrap();

    let bytes = input
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split(',')
        .map(|s| s.trim().parse::<u8>().unwrap())
        .collect::<Vec<u8>>();

    let keypair = Keypair::from_bytes(&bytes).expect("Invalid keypair bytes");
    println!("Your public key is:\n{}", keypair.pubkey());
}

pub fn convert_wallet() {
    println!("Choose conversion:");
    println!("1) Base58 → Wallet bytes");
    println!("2) Wallet bytes → Base58");
    println!("3) Wallet bytes → Pubkey");

    let mut choice = String::new();
    io::stdin().read_line(&mut choice).unwrap();

    match choice.trim() {
        "1" => base58_to_wallet(),
        "2" => wallet_to_base58(),
        "3" => wallet_bytes_to_pubkey(),
        _ => println!("Invalid choice"),
    }
}