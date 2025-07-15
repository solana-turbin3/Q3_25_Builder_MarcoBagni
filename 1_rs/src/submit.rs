use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer},
    system_program,
    transaction::Transaction,
};
use std::str::FromStr;

pub fn submit() {
    // Step 1: Create a Solana RPC client
    let rpc_url = "https://api.devnet.solana.com";
    let rpc_client = RpcClient::new(rpc_url.to_string());

    // Step 2: Load your signer keypair
    let signer = read_keypair_file("d1x-wallet.json").expect("Couldn't find wallet file");

    // Step 3: Define program and account public keys
    let mint = Keypair::new(); // The NFT to be minted
    let turbin3_program = Pubkey::from_str("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM").unwrap();
    let collection = Pubkey::from_str("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2").unwrap();
    let mpl_core_program = Pubkey::from_str("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d").unwrap();
    let system_program = system_program::id();

    // Step 4: Get the PDA (Program Derived Address)
    let signer_pubkey = signer.pubkey();
    let seeds: &[&[u8]] = &[b"prereqs", signer_pubkey.as_ref()];
    let (prereq_pda, _bump) = Pubkey::find_program_address(seeds, &turbin3_program);

    // Step 5: Prepare the instruction data (discriminator)
    let data = vec![77, 124, 82, 163, 21, 133, 181, 206]; // submit_ts discriminator

    // Step 6: Define the accounts metadata
    let authority_seeds: Vec<&[u8]> = vec![b"collection", collection.as_ref()];
    let (authority_pda, _) = Pubkey::find_program_address(&authority_seeds, &turbin3_program);
    //println!("📌 Computed authority PDA: {}", authority_pda);


    let accounts = vec![
        AccountMeta::new(signer.pubkey(), true),           // user
        AccountMeta::new(prereq_pda, false),               // account
        AccountMeta::new(mint.pubkey(), true),             // mint
        AccountMeta::new(collection, false),               // collection
        AccountMeta::new_readonly(authority_pda, false),   // authority PDA
        AccountMeta::new_readonly(mpl_core_program, false),
        AccountMeta::new_readonly(system_program, false),
    ];

    // Step 7: Get the recent blockhash
    let blockhash = rpc_client
        .get_latest_blockhash()
        .expect("Failed to get recent blockhash");

    // Step 8: Build the instruction
    let instruction = Instruction {
        program_id: turbin3_program,
        accounts,
        data,
    };

    // Step 9: Create and sign the transaction
    let tx = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&signer.pubkey()),
        &[&signer, &mint],
        blockhash,
    );

    // Step 10: Send and confirm the transaction
    let sig = rpc_client
        .send_and_confirm_transaction(&tx)
        //.simulate_transaction(&tx)
        .expect("Failed to send transaction");

    println!(
        "✅ Success! https://explorer.solana.com/tx/{}?cluster=devnet",
        sig
    );
    //println!("🔍 Simulation result: {:#?}", sig);
}