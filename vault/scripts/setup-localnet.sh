#!/bin/bash

echo "Setting up Solana localnet..."

# Kill any existing validator
pkill -f solana-test-validator

# Start local validator
echo "Starting local validator..."
solana-test-validator --reset --quiet &

# Wait for validator to start
sleep 5

# Configure CLI for localnet
solana config set --url localhost

# Use existing d1x wallet
echo "Using existing wallet: d1x.json"
solana config set --keypair ~/.config/solana/d1x.json

# Airdrop SOL to d1x wallet
echo "Airdropping SOL to d1x wallet..."
solana airdrop 2 $(solana-keygen pubkey ~/.config/solana/d1x.json)

echo "Localnet setup complete!"
echo "Validator running on localhost:8899"
echo "Wallet: $(solana-keygen pubkey ~/.config/solana/d1x.json)"