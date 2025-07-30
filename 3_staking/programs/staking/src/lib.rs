use anchor_lang::prelude::*;

declare_id!("5HKADJFrrocX1PrXdTBxzJEPGZA5xg4EbRMz19aZJmRR");

pub mod instructions;
pub mod states;
pub mod errors;

pub use instructions::*;

#[program]
pub mod staking {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        points_per_stake: u8,
        max_unstake: u8,
        freeze_period: u32,
    ) -> Result<()> {
        ctx.accounts
            .initialize_config(points_per_stake, max_unstake, freeze_period, ctx.bumps)
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        ctx.accounts.initialize_user(ctx.bumps)
    }

    pub fn stake(ctx: Context<Stake>, amount: u8) -> Result<()> {
        ctx.accounts.stake(ctx.bumps, amount)
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u8) -> Result<()> {
        ctx.accounts.unstake(amount)
    }

    pub fn claim_rewards(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim()
    }
}