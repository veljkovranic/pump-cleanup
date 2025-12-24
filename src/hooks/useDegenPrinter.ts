/**
 * useDegenPrinter Hook
 * 
 * Handles the "PRINT" operation - closing token accounts and reclaiming rent.
 * This hook manages:
 * - Transaction building and batching
 * - Wallet signing flow
 * - Progress tracking and status updates
 * - Fee calculation and transfer
 * - Session statistics
 * 
 * The printing process:
 * 1. Build transactions to close accounts (batched for efficiency)
 * 2. Add fee transfer transaction (if fee recipient is configured)
 * 3. Request wallet signature for each transaction
 * 4. Submit transactions to the network
 * 5. Track and report results
 */

import { useState, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  createCloseAccountTransactions,
  CloseableAccount,
  getExplorerUrl,
} from '@/lib/solana';
import {
  FEE_PERCENTAGE,
  FEE_RECIPIENT,
  FEE_ENABLED,
  SOLANA_NETWORK,
  STATUS_UPDATE_DELAY,
} from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export type PrintStatus =
  | 'idle'
  | 'preparing'
  | 'awaiting_signature'
  | 'submitting'
  | 'confirming'
  | 'success'
  | 'error'
  | 'partial_success';

export interface PrintProgress {
  /** Current status of the print operation */
  status: PrintStatus;
  /** Human-readable message about current status */
  message: string;
  /** Current transaction number (1-indexed) */
  currentTx: number;
  /** Total number of transactions */
  totalTx: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

export interface PrintResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of accounts successfully closed */
  accountsClosed: number;
  /** Total lamports reclaimed */
  lamportsReclaimed: number;
  /** Total SOL reclaimed */
  solReclaimed: number;
  /** SOL kept by user (after fees) */
  solKept: number;
  /** Fee paid */
  feePaid: number;
  /** Transaction signatures */
  signatures: string[];
  /** Error message if operation failed */
  error?: string;
}

export interface SessionStats {
  /** Total SOL printed this session */
  totalSolPrinted: number;
  /** Total accounts closed this session */
  totalAccountsClosed: number;
  /** Number of successful print operations */
  printCount: number;
}

export interface UseDegenPrinterReturn {
  /** Execute the print operation */
  print: (accounts: CloseableAccount[], customDestination?: string) => Promise<PrintResult | null>;
  /** Current progress of the print operation */
  progress: PrintProgress;
  /** Whether a print is in progress */
  isPrinting: boolean;
  /** Result of the last print operation */
  lastResult: PrintResult | null;
  /** Session statistics */
  sessionStats: SessionStats;
  /** Reset the printer state */
  reset: () => void;
  /** Fee percentage as a number (0-1) */
  feePercentage: number;
  /** Whether fee collection is enabled */
  feeEnabled: boolean;
  /** Get explorer URL for a signature */
  getExplorerLink: (signature: string) => string;
}

// ============================================================================
// INITIAL STATES
// ============================================================================

const initialProgress: PrintProgress = {
  status: 'idle',
  message: '',
  currentTx: 0,
  totalTx: 0,
  percentage: 0,
};

const initialStats: SessionStats = {
  totalSolPrinted: 0,
  totalAccountsClosed: 0,
  printCount: 0,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useDegenPrinter(): UseDegenPrinterReturn {
  const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [progress, setProgress] = useState<PrintProgress>(initialProgress);
  const [lastResult, setLastResult] = useState<PrintResult | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialStats);

  // Parse fee recipient once
  const feeRecipientPubkey = useMemo(() => {
    if (!FEE_ENABLED || !FEE_RECIPIENT) return undefined;
    try {
      return new PublicKey(FEE_RECIPIENT);
    } catch {
      console.warn('Invalid fee recipient address:', FEE_RECIPIENT);
      return undefined;
    }
  }, []);

  /**
   * Updates progress state with a delay for visual feedback.
   */
  const updateProgress = useCallback((update: Partial<PrintProgress>) => {
    setProgress(prev => ({ ...prev, ...update }));
  }, []);

  /**
   * Executes the print operation - closes accounts and reclaims rent.
   * 
   * Flow:
   * 1. Validate wallet and accounts
   * 2. Build close transactions (batched)
   * 3. Add fee transaction if enabled
   * 4. Sign all transactions via wallet
   * 5. Submit each transaction sequentially
   * 6. Track results and update stats
   */
  const print = useCallback(
    async (accounts: CloseableAccount[], customDestination?: string): Promise<PrintResult | null> => {
      // Parse custom destination if provided
      let destinationPubkey: PublicKey | undefined;
      if (customDestination) {
        try {
          destinationPubkey = new PublicKey(customDestination);
          console.log('[DegenPrinter] Using custom destination:', customDestination);
        } catch {
          console.warn('Invalid custom destination, using default');
        }
      }
      // Validate prerequisites
      if (!publicKey) {
        setLastResult({
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: 'Wallet not connected',
        });
        return null;
      }

      if (!signAllTransactions && !signTransaction) {
        setLastResult({
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: 'Wallet does not support transaction signing',
        });
        return null;
      }

      if (accounts.length === 0) {
        setLastResult({
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: 'No accounts to close',
        });
        return null;
      }

      try {
        // STEP 1: Preparing transactions
        updateProgress({
          status: 'preparing',
          message: 'Preparing transactions...',
          currentTx: 0,
          totalTx: 0,
          percentage: 5,
        });

        await new Promise(r => setTimeout(r, STATUS_UPDATE_DELAY));

        // Calculate totals for result tracking
        const totalLamports = accounts.reduce((sum, acc) => sum + acc.rentLamports, 0);
        const totalSol = totalLamports / 1e9;
        const feeLamports = FEE_ENABLED ? Math.floor(totalLamports * FEE_PERCENTAGE) : 0;
        const feeSol = feeLamports / 1e9;
        const userLamports = totalLamports - feeLamports;
        const userSol = userLamports / 1e9;

        // Build transactions
        const transactions = await createCloseAccountTransactions(
          accounts,
          publicKey,
          feeRecipientPubkey,
          FEE_ENABLED ? FEE_PERCENTAGE : 0,
          destinationPubkey // Custom destination for rent refund
        );

        updateProgress({
          totalTx: transactions.length,
          percentage: 10,
        });

        // STEP 2: Request wallet signature
        updateProgress({
          status: 'awaiting_signature',
          message: `Please sign ${transactions.length} transaction${transactions.length > 1 ? 's' : ''} in your wallet...`,
          percentage: 15,
        });

        let signedTransactions: Transaction[];

        try {
          if (signAllTransactions) {
            // Preferred: Sign all transactions at once
            signedTransactions = await signAllTransactions(transactions);
          } else if (signTransaction) {
            // Fallback: Sign transactions one by one
            signedTransactions = [];
            for (const tx of transactions) {
              const signed = await signTransaction(tx);
              signedTransactions.push(signed);
            }
          } else {
            throw new Error('No signing method available');
          }
        } catch (error: any) {
          // User rejected or signing failed - just go back to idle quietly
          console.log('[DegenPrinter] Signing cancelled or failed:', error?.message);
          
          // Reset to idle state (no error display)
          updateProgress(initialProgress);
          
          // Return cancelled result (not an error)
          return {
            success: false,
            accountsClosed: 0,
            lamportsReclaimed: 0,
            solReclaimed: 0,
            solKept: 0,
            feePaid: 0,
            signatures: [],
            error: 'cancelled', // Special marker for cancelled
          };
        }

        // STEP 3: Submit transactions
        updateProgress({
          status: 'submitting',
          message: 'Submitting transactions...',
          percentage: 25,
        });

        const signatures: string[] = [];
        const confirmedSignatures: string[] = [];
        let accountsClosedSoFar = 0;
        let failedTransactions = 0;
        let lastError: string | null = null;

        for (let i = 0; i < signedTransactions.length; i++) {
          const tx = signedTransactions[i];
          // Fee is now bundled into each transaction, not separate
          const isFeeTransaction = false;

          updateProgress({
            status: 'submitting',
            message: `Submitting transaction ${i + 1} of ${signedTransactions.length}...`,
            currentTx: i + 1,
            percentage: 25 + Math.floor((i / signedTransactions.length) * 50),
          });

          try {
            // Send the raw transaction
            const signature = await connection.sendRawTransaction(tx.serialize(), {
              skipPreflight: false,
              preflightCommitment: 'confirmed',
            });

            signatures.push(signature);

            // Wait for confirmation
            updateProgress({
              status: 'confirming',
              message: `Confirming transaction ${i + 1}...`,
              percentage: 25 + Math.floor(((i + 0.5) / signedTransactions.length) * 50),
            });

            const confirmation = await connection.confirmTransaction(signature, 'confirmed');

            if (confirmation.value.err) {
              console.error(`Transaction ${i + 1} failed on-chain:`, confirmation.value.err);
              failedTransactions++;
              lastError = `Transaction ${i + 1} failed on-chain`;
            } else {
              // Transaction confirmed successfully
              confirmedSignatures.push(signature);
              if (!isFeeTransaction) {
              // Count closed accounts (each tx except fee tx closes accounts)
              const accountsInThisBatch = Math.min(
                10, // MAX_ACCOUNTS_PER_TX
                accounts.length - accountsClosedSoFar
              );
              accountsClosedSoFar += accountsInThisBatch;
              }
            }
          } catch (error: any) {
            console.error(`Transaction ${i + 1} failed:`, error);
            failedTransactions++;
            
            // Try to extract more detailed error message
            let errorMessage = error?.message || 'Unknown error';
            
            // Handle SendTransactionError with logs
            if (error?.logs) {
              console.error('Transaction logs:', error.logs);
              const logErrors = error.logs.filter((log: string) => 
                log.toLowerCase().includes('error') || log.toLowerCase().includes('failed')
              );
              if (logErrors.length > 0) {
                errorMessage = logErrors.join('; ');
              }
            }
            
            // Check for simulation failure
            if (errorMessage.includes('Simulation failed') || errorMessage.includes('simulation failed')) {
              // Parse the simulation error for a cleaner message
              if (errorMessage.includes('Attempt to debit')) {
                errorMessage = 'Account may have already been closed or has insufficient rent';
              } else if (errorMessage.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds to complete transaction';
          }
        }

            lastError = errorMessage;
            
            // If this is the first transaction and it failed, we should stop
            if (i === 0 && confirmedSignatures.length === 0) {
              throw new Error(errorMessage);
            }
          }
        }

        // Determine final result based on what actually succeeded
        const hasConfirmedTransactions = confirmedSignatures.length > 0;
        const allSucceeded = failedTransactions === 0 && hasConfirmedTransactions;
        const partialSuccess = hasConfirmedTransactions && failedTransactions > 0;

        // Calculate actual amounts based on confirmed transactions
        const actualAccountsClosed = accountsClosedSoFar;
        const actualLamports = Math.floor(totalLamports * (actualAccountsClosed / accounts.length));
        const actualSol = actualLamports / 1e9;
        const actualFee = FEE_ENABLED ? actualSol * FEE_PERCENTAGE : 0;
        const actualUserSol = actualSol - actualFee;

        if (!hasConfirmedTransactions) {
          // Complete failure - no transactions confirmed
          const result: PrintResult = {
            success: false,
            accountsClosed: 0,
            lamportsReclaimed: 0,
            solReclaimed: 0,
            solKept: 0,
            feePaid: 0,
            signatures: [],
            error: lastError || 'All transactions failed',
          };

          setLastResult(result);
          updateProgress({
            status: 'error',
            message: lastError || 'All transactions failed',
            percentage: 0,
          });

          return result;
        }

        // At least some transactions succeeded
        const result: PrintResult = {
          success: allSucceeded,
          accountsClosed: actualAccountsClosed,
          lamportsReclaimed: actualLamports,
          solReclaimed: actualSol,
          solKept: actualUserSol,
          feePaid: actualFee,
          signatures: confirmedSignatures,
          error: partialSuccess ? `${failedTransactions} transaction(s) failed` : undefined,
        };

        setLastResult(result);

        // Update session stats only for actual success
        if (actualAccountsClosed > 0) {
        setSessionStats(prev => ({
            totalSolPrinted: prev.totalSolPrinted + actualUserSol,
            totalAccountsClosed: prev.totalAccountsClosed + actualAccountsClosed,
          printCount: prev.printCount + 1,
        }));
        }

        updateProgress({
          status: partialSuccess ? 'partial_success' : 'success',
          message: partialSuccess 
            ? `Partial success: ${actualAccountsClosed} accounts closed, ${failedTransactions} failed`
            : `Success! Printed ${actualUserSol.toFixed(4)} SOL`,
          currentTx: signedTransactions.length,
          percentage: 100,
        });

        return result;
      } catch (error: any) {
        console.error('Print operation failed:', error);

        const result: PrintResult = {
          success: false,
          accountsClosed: 0,
          lamportsReclaimed: 0,
          solReclaimed: 0,
          solKept: 0,
          feePaid: 0,
          signatures: [],
          error: error?.message || 'Unknown error occurred',
        };

        setLastResult(result);
        updateProgress({
          status: 'error',
          message: `Error: ${error?.message || 'Unknown error'}`,
          percentage: 0,
        });

        return result;
      }
    },
    [publicKey, signAllTransactions, signTransaction, connection, feeRecipientPubkey, updateProgress]
  );

  /**
   * Resets the printer state to initial values.
   */
  const reset = useCallback(() => {
    setProgress(initialProgress);
    setLastResult(null);
  }, []);

  /**
   * Gets an explorer URL for a transaction signature.
   */
  const getExplorerLink = useCallback((signature: string): string => {
    return getExplorerUrl(signature, 'tx', SOLANA_NETWORK);
  }, []);

  const isPrinting = progress.status !== 'idle' && 
                     progress.status !== 'success' && 
                     progress.status !== 'error' &&
                     progress.status !== 'partial_success';

  return {
    print,
    progress,
    isPrinting,
    lastResult,
    sessionStats,
    reset,
    feePercentage: FEE_PERCENTAGE,
    feeEnabled: FEE_ENABLED,
    getExplorerLink,
  };
}

export default useDegenPrinter;

