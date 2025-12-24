/**
 * DegenPrinter Configuration Constants
 * 
 * These values are read from environment variables with sensible defaults.
 * For production, configure these via your .env file or hosting provider.
 */

import { clusterApiUrl, Cluster } from '@solana/web3.js';

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

/**
 * The Solana network to connect to.
 * Options: 'mainnet-beta', 'devnet', 'testnet'
 * Default: 'devnet' for safety during development
 */
export const SOLANA_NETWORK = (
  process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
) as Cluster;

/**
 * RPC Endpoint for Solana connections.
 * Uses the configured endpoint or falls back to public cluster endpoints.
 * 
 * NOTE: For production, use a dedicated RPC provider (QuickNode, Alchemy, Helius)
 * to avoid rate limits and ensure reliability.
 */
export const RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || clusterApiUrl(SOLANA_NETWORK);

// ============================================================================
// BURN ADDRESS CONFIGURATION
// ============================================================================

/**
 * Address where dust tokens are transferred before closing accounts.
 * This should be a valid Solana address that you control or a known burn address.
 * 
 * Using transfer (instead of burn instruction) works better for some tokens
 * that have restricted burn capabilities.
 * 
 * Set to empty string to use burn instruction instead of transfer.
 */
export const BURN_ADDRESS = process.env.NEXT_PUBLIC_BURN_ADDRESS || '';

/**
 * Whether to use transfer-to-burn-address instead of burn instruction.
 */
export const USE_BURN_ADDRESS = BURN_ADDRESS !== '';

// ============================================================================
// FEE CONFIGURATION
// ============================================================================

/**
 * Fee percentage taken from reclaimed SOL.
 * Default: 0.1 (10%)
 * 
 * Users keep (1 - FEE_PERCENTAGE) of their reclaimed rent.
 */
export const FEE_PERCENTAGE = parseFloat(
  process.env.NEXT_PUBLIC_FEE_PERCENTAGE || '0.10'
);

/**
 * The wallet address that receives the fee portion.
 * 
 * IMPORTANT: Replace this with your actual fee collection wallet before going live!
 */
export const FEE_RECIPIENT = process.env.NEXT_PUBLIC_FEE_RECIPIENT || '';

/**
 * Whether fee collection is enabled.
 * Disabled if no recipient is configured (for local testing).
 */
export const FEE_ENABLED = FEE_RECIPIENT !== '' && FEE_RECIPIENT !== 'YourFeeWalletAddressHere';

// ============================================================================
// TRANSACTION CONFIGURATION
// ============================================================================

/**
 * Maximum number of account close instructions per transaction.
 * 
 * This limit prevents transactions from exceeding compute limits.
 * Each closeAccount instruction is relatively cheap, but we stay conservative
 * to account for varying RPC conditions and ensure transactions succeed.
 * 
 * Recommended: 10-20 accounts per transaction
 */
export const MAX_ACCOUNTS_PER_TX = parseInt(
  process.env.NEXT_PUBLIC_MAX_ACCOUNTS_PER_TX || '10',
  10
);

/**
 * Minimum rent-exempt balance for a token account (in lamports).
 * This is the standard rent exemption for SPL token accounts.
 * 
 * As of 2024, this is approximately 0.00203928 SOL (2,039,280 lamports).
 * The actual value may vary slightly based on account size.
 */
export const TOKEN_ACCOUNT_RENT_LAMPORTS = 2039280;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

/**
 * Delay between status updates during transaction flow (ms).
 * Provides visual feedback to users during multi-step processes.
 */
export const STATUS_UPDATE_DELAY = 500;

/**
 * Shortened address display length.
 * Shows first N and last N characters of addresses.
 */
export const ADDRESS_DISPLAY_LENGTH = 4;


