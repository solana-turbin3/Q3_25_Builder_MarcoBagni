use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow state")]
    InvalidEscrowState,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Escrow not found")]
    EscrowNotFound,
    #[msg("Unauthorized")]
    Unauthorized,
} 