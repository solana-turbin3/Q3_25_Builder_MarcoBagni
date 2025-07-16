use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, 
    token_interface::{ Mint, TokenAccount, TransferChecked, TokenInterface, transfer_checked}
};

use crate::states::Escrow;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)] 
    pub maker: Signer<'info>, // The escrow creator who deposits tokens and pays for account creation

    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>, // Token mint for the asset being deposited into escrow (Token A)

    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>, // Token mint for the asset expected in return (Token B)

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>, // Maker's token account holding Token A to be escrowed

    #[account(
        init,
        payer = maker,
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
        space = 8 + Escrow::INIT_SPACE,
    )]
    pub escrow: Account<'info, Escrow>, // Escrow state account storing trade parameters and metadata

    #[account(
        init, 
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program    
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>, // Vault token account that holds escrowed Token A
    
    pub token_program: Interface<'info, TokenInterface>, // Token program interface for SPL token operations
    
    pub associated_token_program: Program<'info, AssociatedToken>, // Associated Token Program for creating and managing ATAs
    
    pub system_program: Program<'info, System>, // System Program required for account creation and rent payments
}

impl<'info> Make<'info> {
    pub fn init_escrow(&mut self, seed: u64, bump: &MakeBumps, receive: u64) -> Result<()>{ // Initializes the escrow account with trade parameters
        self.escrow.set_inner(Escrow { 
            seed, 
            maker: self.maker.key(), 
            mint_a: self.mint_a.key(), 
            mint_b: self.mint_b.key(), 
            receive, 
            bump: bump.escrow 
        });

        Ok(())
    } 

    pub fn deposit(&mut self, amount: u64) -> Result<()> { // Deposits Token A from maker's account into the escrow vault
        let decimals = self.mint_a.decimals;
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked{            
            mint: self.mint_a.to_account_info(),
            from: self.maker_ata_a.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };

        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_context, amount, decimals) // Transfer tokens with decimal validation for security
    }
}