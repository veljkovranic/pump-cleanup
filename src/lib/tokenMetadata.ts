/**
 * Token Metadata Service
 * 
 * Smart caching and batching for token metadata and prices.
 * Minimizes RPC calls by:
 * - Aggressive caching with long TTL
 * - Batching multiple requests
 * - Deduplicating in-flight requests
 * - Pre-fetching on scan completion
 */

import { RPC_ENDPOINT } from './constants';

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  decimals: number;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

// Long-lived caches - token metadata rarely changes
const metadataCache = new Map<string, TokenMetadata>();
const priceCache = new Map<string, { price: number; timestamp: number }>();

// In-flight request deduplication
let pendingMetadataRequest: Promise<Map<string, TokenMetadata>> | null = null;
let pendingPriceRequest: Promise<Map<string, number>> | null = null;
let pendingAddresses: Set<string> = new Set();

// Cache TTL
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for prices
const METADATA_NEVER_EXPIRES = true; // Metadata cached forever (per session)

// ============================================================================
// SMART METADATA FETCHING
// ============================================================================

/**
 * Pre-fetch token data for a list of addresses.
 * Call this once after scan completes to warm the cache.
 * Returns immediately if already cached.
 */
export async function prefetchTokenData(mintAddresses: string[]): Promise<void> {
  // Filter out already cached
  const uncached = mintAddresses.filter(addr => !metadataCache.has(addr));
  
  if (uncached.length === 0) {
    console.log('[TokenCache] All tokens already cached');
    return;
  }

  console.log(`[TokenCache] Pre-fetching ${uncached.length} tokens...`);
  
  // Fetch metadata and prices in parallel
  await Promise.all([
    fetchTokenMetadataBatched(uncached),
    fetchTokenPricesBatched(uncached),
  ]);
  
  console.log('[TokenCache] Pre-fetch complete');
}

/**
 * Get cached metadata - returns immediately from cache.
 * Call prefetchTokenData first to warm the cache.
 */
export function getCachedMetadata(address: string): TokenMetadata | null {
  return metadataCache.get(address) || null;
}

/**
 * Get cached price - returns immediately from cache.
 */
export function getCachedPrice(address: string): number {
  const cached = priceCache.get(address);
  if (cached && (Date.now() - cached.timestamp) < PRICE_CACHE_TTL) {
    return cached.price;
  }
  return 0;
}

/**
 * Get all cached data for multiple addresses.
 * Fast - no network calls, just cache lookup.
 */
export function getCachedTokenInfo(mintAddresses: string[]): {
  metadata: Map<string, TokenMetadata>;
  prices: Map<string, number>;
} {
  const metadata = new Map<string, TokenMetadata>();
  const prices = new Map<string, number>();

  for (const addr of mintAddresses) {
    const meta = metadataCache.get(addr);
    if (meta) metadata.set(addr, meta);
    
    const priceData = priceCache.get(addr);
    if (priceData) prices.set(addr, priceData.price);
  }

  return { metadata, prices };
}

// ============================================================================
// BATCHED FETCHING (Internal)
// ============================================================================

/**
 * Batch fetch metadata - deduplicates concurrent requests
 */
async function fetchTokenMetadataBatched(addresses: string[]): Promise<Map<string, TokenMetadata>> {
  const result = new Map<string, TokenMetadata>();
  
  // Filter already cached
  const toFetch = addresses.filter(addr => !metadataCache.has(addr));
  if (toFetch.length === 0) return result;

  // Try DAS API first (single batch call)
  try {
    const dasResult = await fetchFromDAS(toFetch);
    dasResult.forEach((meta, addr) => {
      result.set(addr, meta);
      metadataCache.set(addr, meta);
    });
  } catch (e) {
    console.log('[TokenCache] DAS not available');
  }

  // Fall back to Jupiter for missing (single call, filters client-side)
  const stillMissing = toFetch.filter(addr => !result.has(addr));
  if (stillMissing.length > 0) {
    try {
      const jupResult = await fetchFromJupiterCached(stillMissing);
      jupResult.forEach((meta, addr) => {
        result.set(addr, meta);
        metadataCache.set(addr, meta);
      });
    } catch (e) {
      console.log('[TokenCache] Jupiter fetch failed');
    }
  }

  // Create placeholders for anything still missing
  toFetch.forEach(addr => {
    if (!result.has(addr) && !metadataCache.has(addr)) {
      const placeholder: TokenMetadata = {
        address: addr,
        name: 'Unknown Token',
        symbol: addr.slice(0, 4) + '...',
        logoURI: null,
        decimals: 0,
      };
      result.set(addr, placeholder);
      metadataCache.set(addr, placeholder);
    }
  });

  return result;
}

/**
 * Batch fetch prices - single API call for all tokens
 */
async function fetchTokenPricesBatched(addresses: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const now = Date.now();

  // Filter already cached (and not expired)
  const toFetch = addresses.filter(addr => {
    const cached = priceCache.get(addr);
    return !cached || (now - cached.timestamp) >= PRICE_CACHE_TTL;
  });

  if (toFetch.length === 0) return result;

  try {
    // Single Jupiter API call (supports up to 100 tokens)
    const ids = toFetch.slice(0, 100).join(',');
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
    
    if (response.ok) {
      const data = await response.json();
      for (const addr of toFetch) {
        const priceData = data.data?.[addr];
        const price = priceData?.price ? parseFloat(priceData.price) : 0;
        result.set(addr, price);
        priceCache.set(addr, { price, timestamp: now });
      }
    }
  } catch (e) {
    console.error('[TokenCache] Price fetch error:', e);
  }

  // Set 0 for any we couldn't get
  for (const addr of toFetch) {
    if (!result.has(addr)) {
      result.set(addr, 0);
      priceCache.set(addr, { price: 0, timestamp: now });
    }
  }

  return result;
}

// ============================================================================
// API CALLS (Low-level)
// ============================================================================

// Jupiter token list cache (fetched once per session)
let jupiterTokenListCache: Map<string, any> | null = null;
let jupiterFetchPromise: Promise<Map<string, any>> | null = null;

async function getJupiterTokenList(): Promise<Map<string, any>> {
  if (jupiterTokenListCache) return jupiterTokenListCache;
  
  if (jupiterFetchPromise) return jupiterFetchPromise;

  jupiterFetchPromise = (async () => {
    const response = await fetch('https://token.jup.ag/strict');
    const tokens: any[] = await response.json();
    
    const map = new Map<string, any>();
    for (const token of tokens) {
      map.set(token.address, token);
    }
    
    jupiterTokenListCache = map;
    console.log(`[TokenCache] Jupiter list cached: ${map.size} tokens`);
    return map;
  })();

  return jupiterFetchPromise;
}

async function fetchFromJupiterCached(addresses: string[]): Promise<Map<string, TokenMetadata>> {
  const result = new Map<string, TokenMetadata>();
  const tokenList = await getJupiterTokenList();

  for (const addr of addresses) {
    const token = tokenList.get(addr);
    if (token) {
      result.set(addr, {
        address: addr,
        name: token.name || 'Unknown',
        symbol: token.symbol || '???',
        logoURI: token.logoURI || null,
        decimals: token.decimals || 0,
      });
    }
  }

  return result;
}

async function fetchFromDAS(addresses: string[]): Promise<Map<string, TokenMetadata>> {
  const result = new Map<string, TokenMetadata>();

  // QuickNode uses "getAssets" (not "getAssetBatch")
  const response = await fetch(RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'das-batch',
      method: 'getAssets',
      params: { ids: addresses },
    }),
  });

  if (!response.ok) throw new Error('DAS request failed');

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  // Handle both array result and object with items
  const assets = Array.isArray(data.result) ? data.result : (data.result?.items || []);
  
  for (const asset of assets) {
    if (!asset?.id) continue;
    result.set(asset.id, {
      address: asset.id,
      name: asset.content?.metadata?.name || 'Unknown',
      symbol: asset.content?.metadata?.symbol || '???',
      logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri || null,
      decimals: asset.token_info?.decimals || 0,
    });
  }

  return result;
}

// ============================================================================
// LEGACY API (for backwards compatibility)
// ============================================================================

export async function fetchTokenMetadata(mintAddresses: string[]): Promise<Map<string, TokenMetadata>> {
  return fetchTokenMetadataBatched(mintAddresses);
}

export async function fetchTokenPrices(mintAddresses: string[]): Promise<Map<string, number>> {
  return fetchTokenPricesBatched(mintAddresses);
}

export async function fetchTokenInfo(mintAddresses: string[]): Promise<{
  metadata: Map<string, TokenMetadata>;
  prices: Map<string, number>;
}> {
  const [metadata, prices] = await Promise.all([
    fetchTokenMetadataBatched(mintAddresses),
    fetchTokenPricesBatched(mintAddresses),
  ]);
  return { metadata, prices };
}
