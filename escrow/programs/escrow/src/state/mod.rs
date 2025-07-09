use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct Escrow {
    pub seed: u64,
    pub maker: Pubkey,
    pub maker_token: Pubkey,
    pub taker_token: Pubkey,
    pub offer_amount: u64,
    pub auth_bump: u8,
    pub vault_bump: u8,
    pub escrow_bump: u8,
}