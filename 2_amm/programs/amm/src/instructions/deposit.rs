use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ Transfer, transfer, Mint, Token, TokenAccount, MintTo, mint_to },
};

use crate::{ state::Config, error::AmmError };

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,

    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = config
    )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"lp", config.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = config,
    )]
    pub mint_lp: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = user
    )]
    pub user_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_lp,
        associated_token::authority = user
    )]
    pub user_lp: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    pub fn deposit_tokens(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (self.user_x.to_account_info(), self.vault_x.to_account_info()),
            false => (self.user_y.to_account_info(), self.vault_y.to_account_info()),
        };
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.user.to_account_info(),
        };

        let ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(ctx, amount)
    }

    pub fn mint_lp_tokens(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = MintTo {
            mint: self.mint_lp.to_account_info(),
            to: self.user_lp.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let seeds = &[&b"config"[..], &self.config.seed.to_le_bytes(), &[self.config.config_bump]];
        let signer_seeds = &[&seeds[..]];

        let ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(ctx, amount)
    }

    fn calculate_deposit_amounts(
        reserve_x: u64,
        reserve_y: u64,
        lp_supply: u64,
        lp_amount: u64,
    ) -> Result<(u64, u64)> {
        if lp_supply == 0 {
            // First deposit - use max amounts
            return Ok((reserve_x, reserve_y));
        }

        // Calculate proportional amounts based on constant product formula
        let x_amount = (reserve_x * lp_amount) / lp_supply;
        let y_amount = (reserve_y * lp_amount) / lp_supply;

        Ok((x_amount, y_amount))
    }

    pub fn deposit(&mut self, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        // Check if pool is locked
        require!(!self.config.locked, AmmError::PoolLocked);
        require!(amount != 0, AmmError::InvalidAmount);

        let (x, y) = if self.mint_lp.supply == 0 &&
            self.vault_x.amount == 0 &&
            self.vault_y.amount == 0
        {
            // First deposit - use max amounts
            (max_x, max_y)
        } else {
            // Subsequent deposits - calculate proportional amounts
            let amounts = Self::calculate_deposit_amounts(
                self.vault_x.amount,
                self.vault_y.amount,
                self.mint_lp.supply,
                amount,
            ).map_err(|_| AmmError::InvalidAmount)?;
            (amounts.0, amounts.1)
        };

        // Check slippage
        require!(x <= max_x && y <= max_y, AmmError::SlippageExceeded);

        // Perform the deposits
        self.deposit_tokens(true, x)?;
        self.deposit_tokens(false, y)?;

        // Mint LP tokens
        self.mint_lp_tokens(amount)?;

        Ok(())
    }
}