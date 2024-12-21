use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("5gHmZioZSYtXCygCi9GeX2JYS5CFa4DBbcipddk9UDcf");

const GAS_FEE: u64 = 1_000_000;

#[program]
pub mod voting_contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.admin = ctx.accounts.admin.key();
        state.is_active_round = false;
        state.round_number = 0;
        state.voting_period = 0;
        state.start_time = 0;
        Ok(())
    }

    pub fn start_new_round(ctx: Context<StartNewRound>, voting_period: i64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(!state.is_active_round, CustomError::RoundAlreadyActive);

        state.voting_period = voting_period;
        state.start_time = Clock::get()?.unix_timestamp;
        state.is_active_round = true;
        state.round_number += 1;

        for (id, pool) in [
            &mut ctx.accounts.pool_0,
            &mut ctx.accounts.pool_1,
            &mut ctx.accounts.pool_2,
        ]
            .iter_mut()
            .enumerate()
        {
            pool.id = id as u8;
            pool.votes = vec![];
            pool.total_funds = 0;
            pool.round_number = state.round_number;
        }

        emit!(RoundStarted {
            round_number: state.round_number,
            start_time: state.start_time,
            voting_period,
            pool_0: ctx.accounts.pool_0.key(),
            pool_1: ctx.accounts.pool_1.key(),
            pool_2: ctx.accounts.pool_2.key(),
        });

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, amount: u64) -> Result<()> {
        let state = &ctx.accounts.state;
        let pool = &mut ctx.accounts.pool;
        let user = ctx.accounts.user.key();

        require!(state.is_active_round, CustomError::NoActiveRound);
        require!(
            pool.round_number == state.round_number,
            CustomError::InvalidRound
        );

        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time <= state.start_time + state.voting_period,
            CustomError::VotingEnded
        );

        require!(
            !pool.votes.iter().any(|v| v.user == user),
            CustomError::AlreadyVoted
        );

        // Update state before transferring funds
        pool.votes.push(VoteRecord { user, amount });
        pool.total_funds = pool
            .total_funds
            .checked_add(amount)
            .ok_or(CustomError::OverflowError)?;

        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &pool.to_account_info().key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[ctx.accounts.user.to_account_info(), pool.to_account_info()],
        ).map_err(|_| CustomError::TransferFailed)?;

        Ok(())
    }

    pub fn claim_pool_funds(ctx: Context<ClaimPoolFunds>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let pool_0 = &mut ctx.accounts.pool_0;
        let pool_1 = &mut ctx.accounts.pool_1;
        let pool_2 = &mut ctx.accounts.pool_2;
        let admin = &mut ctx.accounts.admin;

        // Add admin check
        require!(admin.key() == state.admin, CustomError::UnauthorizedClaim);

        let current_time = Clock::get()?.unix_timestamp;

        require!(state.is_active_round, CustomError::NoActiveRound);
        require!(
            current_time > state.start_time + state.voting_period,
            CustomError::VotingNotEnded
        );

        let (winning_pool, mut losing_pools) = if pool_0.total_funds >= pool_1.total_funds
            && pool_0.total_funds >= pool_2.total_funds
        {
            (pool_0, vec![pool_1, pool_2])
        } else if pool_1.total_funds >= pool_0.total_funds
            && pool_1.total_funds >= pool_2.total_funds
        {
            (pool_1, vec![pool_0, pool_2])
        } else {
            (pool_2, vec![pool_0, pool_1])
        };

        let lamports = **winning_pool.to_account_info().try_borrow_lamports()?;
        **winning_pool.to_account_info().try_borrow_mut_lamports()? -= lamports;
        **admin.to_account_info().try_borrow_mut_lamports()? += lamports;

        let mut refund_accounts = vec![];

        for losing_pool in losing_pools.iter_mut() {
            for vote in &losing_pool.votes {
                if vote.amount > GAS_FEE {
                    let actual_refund = vote.amount - GAS_FEE;
                    refund_accounts.push((vote.user, actual_refund, losing_pool.id));
                } else {
                    emit!(RefundSkipped {
                        round_number: state.round_number,
                        pool_id: losing_pool.id,
                        user: vote.user,
                        amount: vote.amount,
                    });
                }
            }
            **losing_pool.to_account_info().try_borrow_mut_lamports()? -= losing_pool.total_funds;
        }

        let admin_fee = refund_accounts.len() as u64 * GAS_FEE;
        **admin.to_account_info().try_borrow_mut_lamports()? += admin_fee;

        for (user_key, refund_amount, pool_id) in refund_accounts {
            let user_account = ctx
                .remaining_accounts
                .iter()
                .find(|acc| acc.key == &user_key)
                .ok_or(CustomError::UserAccountNotFound)?;

            **user_account.try_borrow_mut_lamports()? += refund_amount;

            emit!(RefundProcessed {
                round_number: state.round_number,
                pool_id,
                user: user_key,
                amount: refund_amount,
                gas_fee: GAS_FEE,
            });
        }

        state.is_active_round = false;

        emit!(RoundCompleted {
            round_number: state.round_number,
            winning_pool: winning_pool.id,
            total_funds: winning_pool.total_funds,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = admin, space = 8 + 32 + 8 + 8 + 1 + 8)]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartNewRound<'info> {
    #[account(mut, has_one = admin)]
    pub state: Account<'info, ProgramState>,
    #[account(init, payer = admin, space = 8 + std::mem::size_of::<Pool>())]
    pub pool_0: Account<'info, Pool>,
    #[account(init, payer = admin, space = 8 + std::mem::size_of::<Pool>())]
    pub pool_1: Account<'info, Pool>,
    #[account(init, payer = admin, space = 8 + std::mem::size_of::<Pool>())]
    pub pool_2: Account<'info, Pool>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPoolFunds<'info> {
    #[account(mut)]
    pub state: Account<'info, ProgramState>,
    #[account(mut)]
    pub pool_0: Account<'info, Pool>,
    #[account(mut)]
    pub pool_1: Account<'info, Pool>,
    #[account(mut)]
    pub pool_2: Account<'info, Pool>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[account]
pub struct ProgramState {
    pub admin: Pubkey,
    pub voting_period: i64,
    pub start_time: i64,
    pub is_active_round: bool,
    pub round_number: u64,
}

#[account]
#[derive(Default)]
pub struct Pool {
    pub id: u8,
    pub votes: Vec<VoteRecord>,
    pub total_funds: u64,
    pub round_number: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VoteRecord {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RoundStarted {
    pub round_number: u64,
    pub start_time: i64,
    pub voting_period: i64,
    pub pool_0: Pubkey,
    pub pool_1: Pubkey,
    pub pool_2: Pubkey,
}

#[event]
pub struct RoundCompleted {
    pub round_number: u64,
    pub winning_pool: u8,
    pub total_funds: u64,
}

#[event]
pub struct RefundProcessed {
    pub round_number: u64,
    pub pool_id: u8,
    pub user: Pubkey,
    pub amount: u64,
    pub gas_fee: u64,
}

#[event]
pub struct RefundSkipped {
    pub round_number: u64,
    pub pool_id: u8,
    pub user: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum CustomError {
    #[msg("Invalid pool ID")]
    InvalidPoolId,
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Voting period has not ended")]
    VotingNotEnded,
    #[msg("Unauthorized withdrawal attempt")]
    UnauthorizedWithdrawal,
    #[msg("User has already voted")]
    AlreadyVoted,
    #[msg("No active voting round")]
    NoActiveRound,
    #[msg("Round already active")]
    RoundAlreadyActive,
    #[msg("Invalid round")]
    InvalidRound,
    #[msg("Unauthorized claim attempt")]
    UnauthorizedClaim,
    #[msg("Overflow occurred during calculation")]
    OverflowError,
    #[msg("Transfer of funds failed")]
    TransferFailed,
    #[msg("User account not found")]
    UserAccountNotFound,
}
