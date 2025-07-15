#!/bin/bash

echo "=== DEPLOYING VAULT PROGRAM ==="

# Build the program
echo "Building program..."
anchor build

# Deploy to localnet
echo "Deploying to localnet..."
anchor deploy

echo "=== DEPLOYMENT COMPLETE ==="