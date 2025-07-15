use anchor_lang::prelude::*;

declare_id!("EHXMkEMsu7eiZ1StSergg8JjJf1b5HvXMYUJ4VnnA29u");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        fee: u16,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        msg!("Initializing AMM with seed: {}", seed);
        ctx.accounts.config.set_inner(
            state::Config {
                seed,
                authority,
                mint_x: ctx.accounts.mint_x.key(),
                mint_y: ctx.accounts.mint_y.key(),
                fee,
                locked: false,
                config_bump: ctx.bumps.config,
                lp_bump: ctx.bumps.mint_lp,
            }
        );
        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
        max_x: u64,
        max_y: u64,
    ) -> Result<()> {
        msg!("Depositing tokens: amount={}, max_x={}, max_y={}", amount, max_x, max_y);
        ctx.accounts.deposit(amount, max_x, max_y)
    }
}
