/**
 * Cleanup Cache Service
 * 
 * Fetches and caches recent cleanup transactions from the Solana blockchain.
 * Runs on a timer to keep data fresh without overloading the RPC.
 */

export interface PayoutEntry {
  wallet: string;
  accountsClosed: number;
  reward: number;
  signature: string;
  timestamp: number; // Unix timestamp in seconds
}

export interface CacheData {
  payouts: PayoutEntry[];
  totalSolReclaimed: number;
  lastUpdated: number;
}

// Global cache
let cache: CacheData = {
  payouts: [],
  totalSolReclaimed: 0,
  lastUpdated: 0,
};

let isFetching = false;

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const FEE_WALLET = process.env.FEE_WALLET || '33fRYeecEUKWoeyfmQxgkGHaDgy8sAJgUsmdgikMpNJ4';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '120000', 10); // 2 minutes default

/**
 * Get the current cached data
 */
export function getCachedData(): CacheData {
  return cache;
}

/**
 * Check if cache is stale
 */
export function isCacheStale(): boolean {
  return Date.now() - cache.lastUpdated > CACHE_TTL_MS;
}

/**
 * Fetch recent cleanup transactions from the blockchain
 */
async function fetchRecentCleanups(): Promise<PayoutEntry[]> {
  console.log('[PumpCleanup API] Fetching recent cleanups from RPC...');
  console.log('[PumpCleanup API] RPC Endpoint:', RPC_ENDPOINT);
  console.log('[PumpCleanup API] Fee Wallet:', FEE_WALLET);

  try {
    // Get recent signatures for the fee wallet
    const sigResponse = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'sigs',
        method: 'getSignaturesForAddress',
        params: [FEE_WALLET, { limit: 20 }],
      }),
    });

    const sigData = await sigResponse.json() as { error?: any; result?: any[] };
    
    // Debug: log raw response
    if (sigData.error) {
      console.error('[PumpCleanup API] RPC Error:', sigData.error);
      return [];
    }
    
    const signatures = sigData.result || [];
    console.log(`[PumpCleanup API] Found ${signatures.length} signatures`);

    if (signatures.length === 0) {
      console.log('[PumpCleanup API] No signatures found for fee wallet');
      return [];
    }

    // Batch fetch all transactions
    const batchRequests = signatures.map((s: any, idx: number) => ({
      jsonrpc: '2.0',
      id: `tx-${idx}`,
      method: 'getTransaction',
      params: [
        s.signature,
        { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
      ],
    }));

    const txResponse = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchRequests),
    });

    const txData = await txResponse.json() as any;
    const transactions = Array.isArray(txData) 
      ? txData.map((r: any) => r.result) 
      : [];

    // Parse transactions into payout entries
    const payouts: PayoutEntry[] = [];

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
        const userReceived = feeReceived * 9; // 10% fee means user got 9x what we received
        const rentPerAccount = 0.00204;
        const estimatedAccounts = Math.max(1, Math.round(userReceived / 0.9 / rentPerAccount));

        payouts.push({
          wallet: sender,
          accountsClosed: estimatedAccounts,
          reward: userReceived,
          signature: sig.signature,
          timestamp: sig.blockTime || 0,
        });
      } catch (e) {
        // Skip malformed transaction
      }
    }

    console.log(`[PumpCleanup API] Fetched ${payouts.length} cleanup transactions`);
    return payouts;

  } catch (error) {
    console.error('[PumpCleanup API] Error fetching cleanups:', error);
    throw error;
  }
}

// Promise to deduplicate concurrent requests
let fetchPromise: Promise<void> | null = null;

/**
 * Refresh the cache (returns existing promise if already fetching)
 */
async function doRefresh(): Promise<void> {
  console.log('[PumpCleanup API] Refreshing cache...');
  
  try {
    const payouts = await fetchRecentCleanups();
    const totalSolReclaimed = payouts.reduce((sum, p) => sum + p.reward, 0);

    cache = {
      payouts,
      totalSolReclaimed,
      lastUpdated: Date.now(),
    };

    console.log(`[PumpCleanup API] Cache updated. Total SOL reclaimed: ${totalSolReclaimed.toFixed(4)}`);
  } catch (error) {
    console.error('[PumpCleanup API] Failed to refresh cache:', error);
    throw error;
  }
}

/**
 * Get cached data, refreshing if stale (lazy loading)
 * Only fetches when actually requested, not on a timer
 */
export async function getCachedDataAsync(): Promise<CacheData> {
  // If cache is fresh, return immediately
  if (!isCacheStale() && cache.lastUpdated > 0) {
    return cache;
  }

  // If already fetching, wait for that to complete
  if (fetchPromise) {
    await fetchPromise;
    return cache;
  }

  // Start a new fetch
  fetchPromise = doRefresh().finally(() => {
    fetchPromise = null;
  });

  await fetchPromise;
  return cache;
}

/**
 * Trigger a cache refresh in the background (non-blocking)
 */
export function refreshCacheInBackground(): void {
  if (fetchPromise || !isCacheStale()) {
    return;
  }

  fetchPromise = doRefresh().finally(() => {
    fetchPromise = null;
  });
}
