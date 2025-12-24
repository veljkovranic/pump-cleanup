/**
 * RecentPayouts Component
 * 
 * Displays recent successful cleanups from users.
 * Professional table design with clean styling.
 */

import React, { useState, useEffect } from 'react';
import { shortenAddress } from '@/lib/solana';

// Fee wallet address
const FEE_WALLET = '33fRYeecEUKWoeyfmQxgkGHaDgy8sAJgUsmdgikMpNJ4';

interface PayoutEntry {
  wallet: string;
  accountsClosed: number;
  reward: number;
  signature: string;
  date: Date;
}

// ============================================================================
// GLOBAL CACHE
// ============================================================================
let cachedPayouts: PayoutEntry[] | null = null;
let cacheTimestamp: number = 0;
let fetchPromise: Promise<PayoutEntry[]> | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export function getCachedTotalSolReclaimed(): number {
  if (!cachedPayouts) return 0;
  return cachedPayouts.reduce((sum, p) => sum + (p.reward * 10 / 9), 0);
}

async function fetchPayoutsOnce(rpcEndpoint: string): Promise<PayoutEntry[]> {
  if (cachedPayouts && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return cachedPayouts;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const sigResponse = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'sigs',
          method: 'getSignaturesForAddress',
          params: [FEE_WALLET, { limit: 15 }],
        }),
      });

      const sigData = await sigResponse.json();
      const signatures = sigData.result || [];

      if (signatures.length === 0) {
        cachedPayouts = [];
        cacheTimestamp = Date.now();
        return [];
      }

      const batchRequests = signatures.map((s: any, idx: number) => ({
        jsonrpc: '2.0',
        id: `tx-${idx}`,
        method: 'getTransaction',
        params: [
          s.signature,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
        ],
      }));

      const txResponse = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequests),
      });

      const txData = await txResponse.json();
      const transactions = Array.isArray(txData) 
        ? txData.map((r: any) => r.result) 
        : [];

      const parsedPayouts: PayoutEntry[] = [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const sig = signatures[i];
        
        if (!tx || !tx.meta || tx.meta.err) continue;

        try {
          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;
          const accountKeys = tx.transaction.message.accountKeys;

          const accountAddresses: string[] = accountKeys.map((key: any) => {
            if (key.pubkey) {
              return typeof key.pubkey === 'string' ? key.pubkey : key.pubkey.toString();
            }
            return typeof key === 'string' ? key : key.toString();
          });

          const feeWalletIndex = accountAddresses.findIndex(addr => addr === FEE_WALLET);
          if (feeWalletIndex === -1) continue;

          const balanceDiff = postBalances[feeWalletIndex] - preBalances[feeWalletIndex];
          if (balanceDiff <= 0) continue;

          const sender = accountAddresses[0];
          const feeReceived = balanceDiff / 1e9;
          const userReceived = feeReceived * 9;
          const rentPerAccount = 0.00204;
          const estimatedAccounts = Math.max(1, Math.round(userReceived / 0.9 / rentPerAccount));

          parsedPayouts.push({
            wallet: sender,
            accountsClosed: estimatedAccounts,
            reward: userReceived,
            signature: sig.signature,
            date: new Date((sig.blockTime || 0) * 1000),
          });
        } catch (e) {
          // Skip malformed transaction
        }
      }

      cachedPayouts = parsedPayouts;
      cacheTimestamp = Date.now();
      return parsedPayouts;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecentPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutEntry[]>(cachedPayouts || []);
  const [loading, setLoading] = useState(!cachedPayouts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    
    if (cachedPayouts && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      setPayouts(cachedPayouts);
      setLoading(false);
      return;
    }

    fetchPayoutsOnce(rpcEndpoint)
      .then(data => {
        setPayouts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch payouts:', err);
        setError('Failed to load');
        setLoading(false);
      });
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getExplorerLink = (signature: string) => {
    return `https://solscan.io/tx/${signature}`;
  };

  if (loading) {
    return (
      <section className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-cleanup-card border border-cleanup-border rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3 text-cleanup-text-secondary">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading recent activity...
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error('RecentPayouts error:', error);
  }

  const totalSolReclaimed = payouts.reduce((sum, p) => sum + (p.reward * 10 / 9), 0);

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-display text-white">
          Recent Cleanups
        </h3>
        {payouts.length > 0 && (
          <div className="bg-cleanup-secondary/10 border border-cleanup-secondary/20 rounded-lg px-4 py-2">
            <span className="text-xs text-cleanup-text-secondary">Total Reclaimed: </span>
            <span className="text-cleanup-secondary font-bold">{totalSolReclaimed.toFixed(4)} SOL</span>
          </div>
        )}
      </div>
      
      {payouts.length === 0 ? (
        <div className="bg-cleanup-card border border-cleanup-border rounded-2xl p-8 text-center">
          <p className="text-cleanup-text-muted">
            {error ? 'Could not load activity' : 'No cleanups yet. Be the first!'}
          </p>
        </div>
      ) : (
        <div className="bg-cleanup-card border border-cleanup-border rounded-2xl overflow-hidden overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 px-4 md:px-6 py-4 border-b border-cleanup-border text-xs text-cleanup-text-muted uppercase tracking-wider">
            <div>Wallet</div>
            <div>Reclaimed</div>
            <div>Transaction</div>
            <div className="text-right">Date</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-cleanup-border/50">
            {payouts.map((payout) => (
              <div 
                key={payout.signature}
                className="grid grid-cols-4 gap-2 md:gap-4 px-4 md:px-6 py-4 hover:bg-cleanup-hover/50 transition-colors items-center"
              >
                <div className="text-sm">
                  <span className="bg-cleanup-dark px-2.5 py-1.5 rounded-lg text-white font-mono text-xs">
                    <span className="hidden md:inline">{shortenAddress(payout.wallet, 3)}</span>
                    <span className="md:hidden">{shortenAddress(payout.wallet, 2)}</span>
                  </span>
                </div>
                <div className="text-cleanup-secondary font-semibold text-sm">
                  {payout.reward.toFixed(4)} SOL
                </div>
                <div>
                  <a
                    href={getExplorerLink(payout.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-cleanup-primary text-sm hover:underline"
                  >
                    <span className="text-cleanup-secondary">✓</span>
                    <span className="hidden md:inline font-mono text-xs">{shortenAddress(payout.signature, 4)}</span>
                    <span className="md:hidden text-xs">View</span>
                  </a>
                </div>
                <div className="hidden md:block text-cleanup-text-muted text-xs text-right">
                  {formatDate(payout.date)}
                </div>
                <div className="md:hidden text-right text-cleanup-text-muted text-xs">
                  {payout.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecentPayouts;