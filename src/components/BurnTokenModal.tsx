/**
 * BurnTokenModal Component
 * 
 * Modal for selecting which tokens to burn.
 * Shows token list with real metadata, logos, and USD prices.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { CloseableAccount } from '@/lib/solana';
import { FEE_PERCENTAGE } from '@/lib/constants';
import { getCachedTokenInfo, prefetchTokenData, TokenMetadata } from '@/lib/tokenMetadata';

interface BurnTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: CloseableAccount[];
  selectedAccounts: Set<string>;
  onToggleAccount: (address: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onConfirm: () => void;
}

export const BurnTokenModal: React.FC<BurnTokenModalProps> = ({
  isOpen,
  onClose,
  accounts,
  selectedAccounts,
  onToggleAccount,
  onSelectAll,
  onDeselectAll,
  onConfirm,
}) => {
  const [minValueFilter, setMinValueFilter] = useState(0);
  const [tokenMetadata, setTokenMetadata] = useState<Map<string, TokenMetadata>>(new Map());
  const [tokenPrices, setTokenPrices] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Load token data from cache when modal opens (pre-fetched after scan)
  useEffect(() => {
    if (!isOpen || accounts.length === 0) return;

    const mintAddresses = accounts.map(a => a.mint.toBase58());
    
    // Try cache first (instant)
    const cached = getCachedTokenInfo(mintAddresses);
    setTokenMetadata(cached.metadata);
    setTokenPrices(cached.prices);

    // If cache is incomplete, fetch missing (background)
    const missingMetadata = mintAddresses.filter(a => !cached.metadata.has(a));
    if (missingMetadata.length > 0) {
      setIsLoading(true);
      prefetchTokenData(missingMetadata).then(() => {
        const updated = getCachedTokenInfo(mintAddresses);
        setTokenMetadata(updated.metadata);
        setTokenPrices(updated.prices);
        setIsLoading(false);
      });
    }
  }, [isOpen, accounts]);

  // Calculate USD value for each account
  const accountsWithValue = useMemo(() => {
    return accounts.map(account => {
      const mintAddr = account.mint.toBase58();
      const pricePerToken = tokenPrices.get(mintAddr) || 0;
      const usdValue = pricePerToken * account.uiAmount;
      return { ...account, usdValue, pricePerToken };
    }).sort((a, b) => b.usdValue - a.usdValue); // Sort by USD value descending
  }, [accounts, tokenPrices]);

  // Filter accounts by minimum USD value
  const filteredAccounts = useMemo(() => {
    if (minValueFilter === 0) return accountsWithValue;
    return accountsWithValue.filter(a => a.usdValue <= minValueFilter);
  }, [accountsWithValue, minValueFilter]);

  // Calculate max USD value for slider
  const maxUsdValue = useMemo(() => {
    if (accountsWithValue.length === 0) return 100;
    return Math.max(...accountsWithValue.map(a => a.usdValue), 100);
  }, [accountsWithValue]);

  // Calculate totals
  const selectedCount = selectedAccounts.size;
  const selectedSol = accounts
    .filter(a => selectedAccounts.has(a.address.toBase58()))
    .reduce((sum, a) => sum + a.rentSol, 0);
  const estimatedReward = selectedSol * (1 - FEE_PERCENTAGE);

  // Shorten address for display
  const shortenAddress = (addr: string, chars = 4) => 
    `${addr.slice(0, chars)}...${addr.slice(-chars)}`;

  // Format USD value
  const formatUsd = (value: number) => {
    if (value < 0.01) return '< $0.01';
    if (value < 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-degen-darker border border-degen-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-degen-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">
                Select Items to Burn
              </h2>
              <p className="text-gray-400 text-sm font-mono mt-1">
                Burning is basically closing token accounts with balance.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
            <p className="text-purple-400 font-bold text-sm mb-2">Disclaimer:</p>
            <p className="text-purple-300/80 text-xs font-mono">
              ⚠ We are not responsible for any incorrectly selected token burns.
            </p>
          </div>
        </div>


        {/* Token List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px]">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 font-mono flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Loading token info...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-mono">
              No tokens match the filter criteria
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const isSelected = selectedAccounts.has(account.address.toBase58());
              const mintAddr = account.mint.toBase58();
              const metadata = tokenMetadata.get(mintAddr);
              
              return (
                <div
                  key={account.address.toBase58()}
                  onClick={() => onToggleAccount(account.address.toBase58())}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all
                    border ${isSelected 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-degen-border bg-degen-card hover:border-degen-border/80'
                    }
                  `}
                >
                  {/* Token Logo */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {metadata?.logoURI ? (
                      <img 
                        src={metadata.logoURI} 
                        alt={metadata.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '🪙';
                        }}
                      />
                    ) : (
                      <span className="text-2xl">🪙</span>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">
                      {metadata?.name || 'Unknown Token'}
                    </p>
                    <p className="text-gray-500 text-xs font-mono">
                      {shortenAddress(mintAddr, 6)} | {account.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {metadata?.symbol || 'Tokens'}
                    </p>
                  </div>

                  {/* Value & Checkbox */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`
                      w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-orange-500 border-orange-500 text-white' 
                        : 'border-gray-600'
                      }
                    `}>
                      {isSelected && <span className="text-sm">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-degen-border bg-degen-card/50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-gray-400">Selected Tokens:</span>
              <span className="text-white">{selectedCount}</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-gray-400">Estimated SOL Reward:</span>
              <span className="text-orange-400 font-bold">{estimatedReward.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-gray-400">Total Selected Items:</span>
              <span className="text-white">{selectedCount}</span>
            </div>
          </div>

          {/* Select All / Deselect All */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={onSelectAll}
              className="flex-1 py-2 bg-degen-accent/20 text-degen-accent font-bold rounded-lg font-mono hover:bg-degen-accent/30 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onDeselectAll}
              className="flex-1 py-2 bg-red-500/20 text-red-400 font-bold rounded-lg font-mono hover:bg-red-500/30 transition-colors"
            >
              Deselect All
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-degen-card border border-degen-border rounded-lg font-mono text-white hover:bg-degen-border/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={selectedCount === 0}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg font-mono hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BurnTokenModal;
