/**
 * Solana Utility Module
 * 
 * This module provides core Solana functionality for PumpCleanup:
 * - Connection management
 * - Token account scanning
 * - Account closing transactions
 * 
 * All operations are client-side and require user wallet signature.
 * No private keys are ever handled by this code.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import { RPC_ENDPOINT, MAX_ACCOUNTS_PER_TX } from './constants';

// ============================================================================
// CONNECTION SINGLETON
// ============================================================================

let connectionInstance: Connection | null = null;

/**
 * Get or create a Solana connection instance.
 * Uses a singleton pattern to reuse connections across the app.
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_ENDPOINT, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, // 60 seconds
    });
  }
  return connectionInstance;
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a token account that can be safely closed to reclaim rent.
 */
export interface CloseableAccount {
  /** The token account's public key */
  address: PublicKey;
  /** The mint address of the token */
  mint: PublicKey;
  /** Rent lamports that will be reclaimed when closed */
  rentLamports: number;
  /** Human-readable SOL amount */
  rentSol: number;
  /** The token program this account belongs to (TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID) */
  programId: PublicKey;
  /** Is this a pump.fun token */
  isPumpToken: boolean;
}

/**
 * Result of scanning a wallet for closeable token accounts.
 */
export interface ScanResult {
  /** Total number of token accounts found */
  totalAccounts: number;
  /** Accounts that can be safely closed */
  closeableAccounts: CloseableAccount[];
  /** Total lamports that can be reclaimed */
  totalReclaimableLamports: number;
  /** Total SOL that can be reclaimed */
  totalReclaimableSol: number;
  /** Number of accounts skipped (non-zero balance, etc.) */
  skippedAccounts: number;
  /** Number of frozen accounts (cannot be closed) */
  frozenAccounts: number;
  /** Whether results were truncated due to limit */
  isTruncated: boolean;
  /** Total closeable count (including truncated) */
  totalCloseableCount: number;
  /** Estimated total SOL (including truncated) */
  estimatedTotalSol: number;
}

// Maximum accounts to process in detail (for performance)
const MAX_ACCOUNTS_TO_PROCESS = 100;

/**
 * Result of a reclaim (close accounts) operation.
 */
export interface ReclaimResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of accounts successfully closed */
  accountsClosed: number;
  /** Total lamports reclaimed */
  lamportsReclaimed: number;
  /** Total SOL reclaimed (before fees) */
  solReclaimed: number;
  /** Transaction signatures */
  signatures: string[];
  /** Error message if operation failed */
  error?: string;
  /** Accounts that failed to close */
  failedAccounts?: PublicKey[];
}

// ============================================================================
// SCANNING LOGIC
// ============================================================================

/**
 * Try to use QuickNode DAS getTokenAccounts - ONE call for all tokens!
 */
async function tryDASTokenAccounts(walletAddress: string): Promise<any[] | null> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'das-tokens',
        method: 'getTokenAccounts',
        params: { owner: walletAddress },
      }),
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.error) return null;
    
    // QuickNode returns { token_accounts: [...] }
    return data.result?.token_accounts || null;
  } catch {
    return null;
  }
}

/**
 * Scans a wallet for closeable token accounts.
 * 
 * OPTIMIZED: Tries DAS API first (1 call), falls back to standard RPC (2 parallel calls).
 * Only returns empty accounts (zero balance) that can be safely closed.
 * 
 * @param walletAddress - The wallet public key to scan
 * @returns ScanResult with closeable accounts and totals
 */
export async function scanWalletForCloseableAccounts(
  walletAddress: PublicKey
): Promise<ScanResult> {
  const connection = getConnection();
  
  console.log(`%c[PumpCleanup] 🔍 Scanning wallet...`, 'color: #00ff88; font-weight: bold');
  
  const closeableAccounts: CloseableAccount[] = [];
  let totalAccountsFound = 0;
  let skippedAccounts = 0;
  let frozenAccounts = 0;

  // Try DAS API first - SINGLE call for all token accounts!
  const dasAccounts = await tryDASTokenAccounts(walletAddress.toBase58());
  
  let allAccounts: any[] = [];

  if (dasAccounts && dasAccounts.length > 0) {
    console.log(`[PumpCleanup] ✨ Using DAS API (1 call)`);
    // Transform DAS format to our format
    allAccounts = dasAccounts.map((acc: any) => ({
      pubkey: new PublicKey(acc.address),
      account: {
        lamports: acc.lamports || 2039280, // Default rent if not provided
        data: {
          parsed: {
            info: {
              mint: acc.mint,
              state: acc.frozen ? 'frozen' : 'initialized',
              tokenAmount: {
                amount: acc.amount || '0',
                decimals: acc.decimals || 0,
                uiAmount: acc.delegated_amount ? parseFloat(acc.amount) / Math.pow(10, acc.decimals || 0) : 0,
              },
            },
          },
        },
      },
      programId: acc.program_id?.includes('2022') ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
    }));
  } else {
    // Fallback: Standard RPC with parallel fetching
    console.log(`[PumpCleanup] Using standard RPC (2 parallel calls)`);
    const [splAccounts, token2022Accounts] = await Promise.all([
      connection.getParsedTokenAccountsByOwner(walletAddress, { programId: TOKEN_PROGRAM_ID }, 'confirmed')
        .catch(() => ({ value: [] })),
      connection.getParsedTokenAccountsByOwner(walletAddress, { programId: TOKEN_2022_PROGRAM_ID }, 'confirmed')
        .catch(() => ({ value: [] })),
    ]);

    allAccounts = [
      ...splAccounts.value.map(a => ({ ...a, programId: TOKEN_PROGRAM_ID })),
      ...token2022Accounts.value.map(a => ({ ...a, programId: TOKEN_2022_PROGRAM_ID })),
    ];
  }

  console.log(`[PumpCleanup] Found ${allAccounts.length} token accounts`);
  totalAccountsFound = allAccounts.length;

  for (const { pubkey, account, programId } of allAccounts) {
    try {
      const parsedData = account.data.parsed;
      const info = parsedData.info;
      const tokenAmount = info.tokenAmount;
      const mintAddress = info.mint;

      const uiAmount = tokenAmount.uiAmount || 0;
      const rawAmount = tokenAmount.amount || '0';
      const isPumpToken = mintAddress.toLowerCase().endsWith('pump');

      // Skip frozen accounts
      if (info.state === 'frozen') {
        frozenAccounts++;
        continue;
      }

      // Only include empty accounts (zero balance)
      const isEmpty = uiAmount === 0 || rawAmount === '0';
      
      if (!isEmpty) {
        skippedAccounts++;
        continue;
      }

      const rentLamports = account.lamports;
      const rentSol = rentLamports / LAMPORTS_PER_SOL;

      closeableAccounts.push({
        address: pubkey,
        mint: new PublicKey(mintAddress),
        rentLamports,
        rentSol,
        programId,
        isPumpToken,
      });
    } catch (error) {
      skippedAccounts++;
    }
  }

  // Sort by rent amount (highest first)
  closeableAccounts.sort((a, b) => b.rentLamports - a.rentLamports);

  const totalCloseableCount = closeableAccounts.length;
  const isTruncated = closeableAccounts.length > MAX_ACCOUNTS_TO_PROCESS;
  
  // Calculate totals from ALL accounts before truncating
  const totalReclaimableLamports = closeableAccounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );
  const estimatedTotalSol = totalReclaimableLamports / LAMPORTS_PER_SOL;
  
  // Truncate to limit for display/processing
  const truncatedAccounts = closeableAccounts.slice(0, MAX_ACCOUNTS_TO_PROCESS);
  const displayedLamports = truncatedAccounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );

  console.log(`\n`);
  console.log(`%c[PumpCleanup] ═══════════════════════════════════════`, 'color: #00ff88; font-weight: bold');
  console.log(`%c[PumpCleanup] 📊 SCAN COMPLETE`, 'color: #00ff88; font-weight: bold');
  console.log(`[PumpCleanup] Total accounts scanned: ${totalAccountsFound}`);
  console.log(`[PumpCleanup] Closeable found: ${totalCloseableCount}${isTruncated ? ` (showing ${MAX_ACCOUNTS_TO_PROCESS})` : ''}`);
  console.log(`%c[PumpCleanup] Frozen: ${frozenAccounts}`, 'color: #3b82f6');
  console.log(`[PumpCleanup] Skipped (non-empty): ${skippedAccounts}`);
  console.log(`[PumpCleanup] Total reclaimable: ${estimatedTotalSol.toFixed(4)} SOL`);
  if (isTruncated) {
    console.log(`%c[PumpCleanup] ⚠️ Results truncated to ${MAX_ACCOUNTS_TO_PROCESS} for performance`, 'color: #ff6b00');
  }
  console.log(`\n`);

  return {
    totalAccounts: totalAccountsFound,
    closeableAccounts: truncatedAccounts,
    totalReclaimableLamports: displayedLamports,
    totalReclaimableSol: displayedLamports / LAMPORTS_PER_SOL,
    skippedAccounts,
    frozenAccounts,
    isTruncated,
    totalCloseableCount,
    estimatedTotalSol,
  };
}

// ============================================================================
// TRANSACTION BUILDING
// ============================================================================

/**
 * Creates transactions to close multiple token accounts.
 * 
 * Batches close instructions into multiple transactions to avoid
 * exceeding compute limits.
 * 
 * @param accounts - Array of accounts to close (must be empty)
 * @param owner - The wallet that owns these accounts (signs the tx)
 * @param feeRecipient - Optional fee recipient address
 * @param feePercentage - Optional fee percentage (0-1)
 * @param customDestination - Optional custom destination for rent refund
 * @returns Array of transactions ready to be signed
 */
export async function createCloseAccountTransactions(
  accounts: CloseableAccount[],
  owner: PublicKey,
  feeRecipient?: PublicKey,
  feePercentage: number = 0,
  customDestination?: PublicKey
): Promise<Transaction[]> {
  // Destination for rent refund - custom or owner
  const rentDestination = customDestination || owner;
  const connection = getConnection();
  const transactions: Transaction[] = [];

  // Get recent blockhash for transaction validity
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  // Batch accounts into groups that fit in a single transaction
  for (let i = 0; i < accounts.length; i += MAX_ACCOUNTS_PER_TX) {
    const batch = accounts.slice(i, i + MAX_ACCOUNTS_PER_TX);
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = owner;

    // Add compute budget instructions for priority processing
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 100000, // 100k units should be enough for batch operations
      })
    );
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000, // Priority fee for faster inclusion
      })
    );

    // Add close instruction for each account in this batch
    for (const account of batch) {
      const closeInstruction = createCloseAccountInstruction(
        account.address,
        rentDestination,
        owner,
        [],
        account.programId
      );
      transaction.add(closeInstruction);
    }

    // If fee collection is enabled, add fee transfer to THIS transaction
    if (feeRecipient && feePercentage > 0) {
      const batchLamports = batch.reduce((sum, acc) => sum + acc.rentLamports, 0);
      const feeLamports = Math.floor(batchLamports * feePercentage);

      if (feeLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: feeRecipient,
            lamports: feeLamports,
          })
        );
      }
    }

    transactions.push(transaction);
  }

  return transactions;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Shortens a public key for display.
 * Example: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" -> "7xKX...sAsU"
 */
export function shortenAddress(address: string | PublicKey, chars: number = 4): string {
  const str = typeof address === 'string' ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

/**
 * Formats lamports as SOL with specified decimal places.
 */
export function formatSol(lamports: number, decimals: number = 4): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(decimals);
}

/**
 * Validates if a string is a valid Solana public key.
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the explorer URL for a transaction or address.
 */
export function getExplorerUrl(
  signature: string,
  type: 'tx' | 'address' = 'tx',
  network: string = 'devnet'
): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/${type}/${signature}${cluster}`;
}
