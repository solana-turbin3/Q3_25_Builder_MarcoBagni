use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use crate::state::Escrow;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub maker_token: InterfaceAccount<'info, Mint>,
    #[account(
        mint::token_program = token_program
    )]
    pub taker_token: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = maker_token,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_send_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = maker,
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        space = 8 + Escrow::INIT_SPACE,
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = maker_token,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Make<'info> {
    pub fn init_escrow(&mut self, seed: u64, offer_amount: u64, bumps: &MakeBumps) -> Result<()> {
        self.escrow.set_inner(
            Escrow { 
                seed, 
                maker: self.maker.key(), 
                maker_token: self.maker_token.key(), 
                taker_token: self.taker_token.key(), 
                offer_amount, 
                auth_bump: bumps.escrow,
                vault_bump: 0, // Associated token accounts don't have bumps
                escrow_bump: bumps.escrow
            });
        Ok(())
    }

    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        let transfer_accounts = TransferChecked {
            from: self.maker_send_ata.to_account_info(),
            mint: self.maker_token.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info()
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), transfer_accounts);

        transfer_checked(cpi_ctx, deposit, self.maker_token.decimals)
    }
}

pub fn handler(ctx: Context<Make>, seed: u64, offer_amount: u64) -> Result<()> {
    let bumps = ctx.bumps;
    ctx.accounts.init_escrow(seed, offer_amount, &bumps)?;
    ctx.accounts.deposit(offer_amount)?;
    Ok(())
}