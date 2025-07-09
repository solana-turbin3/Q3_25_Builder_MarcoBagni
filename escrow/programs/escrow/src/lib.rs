#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;

declare_id!("5E5xKBqADNUxSxTVc8Nw3jDHfxdbapTj4k4n8azX1ppD");

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

#[program]
pub mod escrow {
    use super::*;

    pub fn make(
        ctx: Context<instructions::make::Make>,
        seed: u64,
        offer_amount: u64,
    ) -> Result<()> {
        instructions::make::handler(ctx, seed, offer_amount)
    }

    pub fn take(ctx: Context<instructions::take::Take>) -> Result<()> {
        instructions::take::handler(ctx)
    }

    pub fn refund(ctx: Context<instructions::refund::Refund>) -> Result<()> {
        instructions::refund::handler(ctx)
    }
}
