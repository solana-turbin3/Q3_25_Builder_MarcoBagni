use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::states::Escrow;

/// Instruction for completing an escrow trade.
/// 
/// Process:
/// 1. Taker sends Token B to maker
/// 2. Escrowed Token A is transferred to taker
/// 3. Vault and escrow accounts are closed
#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>, // The trade counterparty who provides Token B and receives Token A

    #[account(mut)]
    pub maker: SystemAccount<'info>, // Original escrow creator who receives Token B

    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>, // Token mint for the asset taker provides (Token B)

    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>, // Token mint for the asset taker receives (Token A)

    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>, // Taker's token account holding Token B for payment

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_b,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>, // Maker's token account to receive Token B

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_a: Box<InterfaceAccount<'info, TokenAccount>>, // Taker's token account to receive Token A

    #[account(
        mut,
        close = maker,
        has_one = mint_a,
        has_one = maker,
        has_one = mint_b,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>, // Escrow state account containing trade parameters

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>, // Vault holding escrowed Token A

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> Take<'info> {
    pub fn deposit(&mut self) -> Result<()> { // Transfers Token B from taker to maker as payment
        let decimals = self.mint_b.decimals;
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            mint: self.mint_b.to_account_info(),
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_context, self.escrow.receive, decimals)?; // Transfer the exact amount expected by the maker

        Ok(())
    }

    pub fn transfer_and_close_vault(&mut self) -> Result<()> { // Transfers escrowed Token A to taker and closes the vault
        let signer_seeds: &[&[&[u8]]; 1] = &[&[ // Create PDA signer seeds for vault authority
            b"escrow",
            self.maker.key.as_ref(),
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let decimals = self.mint_a.decimals;
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(cpi_context, self.vault.amount, decimals)?; // Transfer all escrowed tokens to taker

        let close_accounts = CloseAccount { // Close vault account and refund rent to maker
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let close_cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            signer_seeds,
        );

        close_account(close_cpi_ctx)?;

        Ok(())
    }
}