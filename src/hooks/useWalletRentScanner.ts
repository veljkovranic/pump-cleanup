/**
 * useWalletRentScanner Hook
 * 
 * Provides functionality to scan a connected wallet for closeable token accounts.
 * Returns the scan results, loading state, and a function to trigger a new scan.
 * 
 * This hook encapsulates all the scanning logic and provides a clean API
 * for the UI components to consume.
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  scanWalletForCloseableAccounts,
  ScanResult,
  CloseableAccount,
} from '@/lib/solana';

// ============================================================================
// TYPES
// ============================================================================

export interface ScanState {
  /** Whether a scan is currently in progress */
  isScanning: boolean;
  /** The result of the last scan, if any */
  result: ScanResult | null;
  /** Error message if the last scan failed */
  error: string | null;
  /** Whether a scan has been performed at least once */
  hasScanned: boolean;
}

export interface UseWalletRentScannerReturn extends ScanState {
  /** Trigger a new wallet scan */
  scan: () => Promise<void>;
  /** Reset the scanner state (clear results) */
  reset: () => void;
  /** Get the list of closeable accounts */
  closeableAccounts: CloseableAccount[];
  /** Get the total reclaimable SOL */
  totalReclaimableSol: number;
  /** Get the total number of closeable accounts */
  closeableCount: number;
  /** Number of frozen accounts found */
  frozenCount: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useWalletRentScanner(): UseWalletRentScannerReturn {
  const { publicKey, connected } = useWallet();

  const [state, setState] = useState<ScanState>({
    isScanning: false,
    result: null,
    error: null,
    hasScanned: false,
  });

  /**
   * Performs a scan of the connected wallet for closeable token accounts.
   * 
   * This function:
   * 1. Validates wallet connection
   * 2. Calls the scanning utility
   * 3. Updates state with results or errors
   */
  const scan = useCallback(async () => {
    // Guard: Ensure wallet is connected
    if (!publicKey || !connected) {
      setState(prev => ({
        ...prev,
        error: 'Wallet not connected. Please connect your wallet first.',
        hasScanned: true,
      }));
      return;
    }

    // Start scanning
    setState(prev => ({
      ...prev,
      isScanning: true,
      error: null,
    }));

    try {
      // Perform the actual scan
      const result = await scanWalletForCloseableAccounts(publicKey);

      setState({
        isScanning: false,
        result,
        error: null,
        hasScanned: true,
      });
    } catch (error) {
      // Handle any errors during scanning
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to scan wallet. Please try again.';

      console.error('Wallet scan error:', error);

      setState(prev => ({
        ...prev,
        isScanning: false,
        error: errorMessage,
        hasScanned: true,
      }));
    }
  }, [publicKey, connected]);

  /**
   * Resets the scanner state to initial values.
   * Useful when user disconnects wallet or wants to start fresh.
   */
  const reset = useCallback(() => {
    setState({
      isScanning: false,
      result: null,
      error: null,
      hasScanned: false,
    });
  }, []);

  // Derive convenience values from the state
  const closeableAccounts = state.result?.closeableAccounts ?? [];
  const totalReclaimableSol = state.result?.totalReclaimableSol ?? 0;
  const closeableCount = closeableAccounts.length;
  const frozenCount = state.result?.frozenAccounts ?? 0;

  return {
    ...state,
    scan,
    reset,
    closeableAccounts,
    totalReclaimableSol,
    closeableCount,
    frozenCount,
  };
}

export default useWalletRentScanner;

