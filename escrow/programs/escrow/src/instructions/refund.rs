use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked, CloseAccount, close_account},
};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub maker_token: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = maker_token,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_receive_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = maker_token,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = maker,
        has_one = maker,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.escrow_bump,
    )]
    pub escrow: Account<'info, Escrow>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Refund<'info> {
    pub fn deposit(&mut self) -> Result<()> {
        let transfer_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.maker_token.to_account_info(),
            to: self.maker_receive_ata.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let maker_key = self.maker.key();
        let seed_bytes = self.escrow.seed.to_le_bytes();
        let bump = [self.escrow.escrow_bump];
        let seeds: [&[u8]; 4] = [
            b"escrow",
            maker_key.as_ref(),
            &seed_bytes,
            &bump,
        ];
        let signer_seeds: &[&[u8]] = &seeds;
        let signer_seeds_array = [signer_seeds];
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_accounts,
            &signer_seeds_array,
        );

        transfer_checked(cpi_ctx, self.escrow.offer_amount, self.maker_token.decimals)
    }

    pub fn close_vault(&mut self) -> Result<()> {
        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let maker_key = self.maker.key();
        let seed_bytes = self.escrow.seed.to_le_bytes();
        let bump = [self.escrow.escrow_bump];
        let seeds: [&[u8]; 4] = [
            b"escrow",
            maker_key.as_ref(),
            &seed_bytes,
            &bump,
        ];
        let signer_seeds: &[&[u8]] = &seeds;
        let signer_seeds_array = [signer_seeds];
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            &signer_seeds_array,
        );

        close_account(cpi_ctx)
    }
}

pub fn handler(ctx: Context<Refund>) -> Result<()> {
    // Deposit: vault -> maker_token -> maker_receive_ata
    ctx.accounts.deposit()?;
    
    // Close vault
    ctx.accounts.close_vault()?;
    
    Ok(())
}


