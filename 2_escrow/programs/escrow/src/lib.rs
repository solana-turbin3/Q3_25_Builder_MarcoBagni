use anchor_lang::prelude::*;

declare_id!("DzHecQ3KDv5q9jjpEYhAzgjGuwXNkzwuiZKXt5LKVkym");

pub mod states;
pub mod instructions;
pub use instructions::*;

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, amount: u64, receive: u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, &ctx.bumps, receive)?;
        ctx.accounts.deposit(amount)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.transfer_and_close_vault()
    }
}
