/**
 * AccountsList Component
 * 
 * Clean, professional list of closeable token accounts with selection.
 */

import React, { useState } from 'react';
import { CloseableAccount, shortenAddress } from '@/lib/solana';
import { FEE_PERCENTAGE } from '@/lib/constants';

interface AccountsListProps {
  accounts: CloseableAccount[];
  selectedAccounts: Set<string>;
  onToggleAccount: (address: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  initialDisplay?: number;
}

export const AccountsList: React.FC<AccountsListProps> = ({
  accounts,
  selectedAccounts,
  onToggleAccount,
  onSelectAll,
  onDeselectAll,
  initialDisplay = 15,
}) => {
  const [showAll, setShowAll] = useState(false);
  
  const displayedAccounts = showAll ? accounts : accounts.slice(0, initialDisplay);
  const hiddenCount = accounts.length - initialDisplay;
  const allSelected = accounts.length > 0 && selectedAccounts.size === accounts.length;

  return (
    <div className="max-h-80 overflow-y-auto">
      {/* Select all / none header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-cleanup-border/50 bg-cleanup-dark/30 sticky top-0 z-10">
        <span className="text-xs text-cleanup-text-muted">
          {selectedAccounts.size} of {accounts.length} selected
        </span>
        <div className="flex gap-4">
          <button
            onClick={onSelectAll}
            className={`text-xs transition-colors ${allSelected ? 'text-cleanup-text-muted' : 'text-cleanup-primary hover:text-cleanup-primary/80'}`}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            onClick={onDeselectAll}
            className={`text-xs transition-colors ${selectedAccounts.size === 0 ? 'text-cleanup-text-muted' : 'text-cleanup-text-secondary hover:text-white'}`}
            disabled={selectedAccounts.size === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="divide-y divide-cleanup-border/30">
        {displayedAccounts.map((account, index) => (
          <AccountRow
            key={account.address.toBase58()}
            account={account}
            index={index}
            isSelected={selectedAccounts.has(account.address.toBase58())}
            onToggle={() => onToggleAccount(account.address.toBase58())}
          />
        ))}
      </div>
      
      {hiddenCount > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-4 text-center text-sm text-cleanup-primary hover:bg-cleanup-primary/5 transition-colors"
        >
          Show {hiddenCount} more
        </button>
      )}
      
      {showAll && accounts.length > initialDisplay && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full py-4 text-center text-sm text-cleanup-text-muted hover:bg-cleanup-hover/30 transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
};

interface AccountRowProps {
  account: CloseableAccount;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, index, isSelected, onToggle }) => {
  const [copied, setCopied] = useState(false);
  const mintAddress = account.mint.toBase58();
  const tokenAccountAddress = account.address.toBase58();
  const solscanUrl = `https://solscan.io/account/${tokenAccountAddress}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(mintAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between py-4 px-5 cursor-pointer transition-colors ${
        isSelected ? 'bg-cleanup-primary/5' : 'hover:bg-cleanup-hover/30'
      }`}
    >
      {/* Left: Checkbox + Index + Address + Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Checkbox */}
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          isSelected ? 'bg-cleanup-primary border-cleanup-primary' : 'border-cleanup-border hover:border-cleanup-text-secondary'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        
        <span className="text-cleanup-text-muted text-xs w-6">{index + 1}.</span>
        
        {/* Solscan link for token account */}
        <a
          href={solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-cleanup-text-secondary hover:text-cleanup-primary transition-colors"
          title="View on Solscan"
          onClick={(e) => e.stopPropagation()}
        >
          {shortenAddress(mintAddress, 4)}
        </a>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="text-cleanup-text-muted hover:text-cleanup-text-secondary text-xs transition-colors"
          title="Copy mint address"
        >
          {copied ? '✓' : '⧉'}
        </button>
        
        {/* Pump.fun or DexScreener link - logo only */}
        {account.isPumpToken ? (
          <a
            href={`https://pump.fun/${mintAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-6 h-6 bg-cleanup-dark rounded-full hover:bg-cleanup-hover transition-colors border border-cleanup-border"
            onClick={(e) => e.stopPropagation()}
            title="View on pump.fun"
          >
            <img 
              src="https://pump.fun/icon.png" 
              alt="pump.fun" 
              width="14" 
              height="14"
              className="rounded-sm"
            />
          </a>
        ) : (
          <a
            href={`https://dexscreener.com/solana/${mintAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-6 h-6 bg-cleanup-dark rounded-full hover:bg-cleanup-hover transition-colors border border-cleanup-border"
            onClick={(e) => e.stopPropagation()}
            title="View on DexScreener"
          >
            <svg width="12" height="12" viewBox="0 0 252 300" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M151.818 106.866c9.177-4.576 20.854-11.312 32.545-20.541 2.465 5.119 2.735 9.586 1.465 13.193-.9 2.542-2.596 4.753-4.826 6.512-2.415 1.901-5.431 3.285-8.765 4.033-6.326 1.425-13.712.593-20.419-3.197m1.591 46.886l12.148 7.017c-24.804 13.902-31.547 39.716-39.557 64.859-8.009-25.143-14.753-50.957-39.556-64.859l12.148-7.017a5.95 5.95 0 003.84-5.845c-1.113-23.547 5.245-33.96 13.821-40.498 3.076-2.342 6.434-3.518 9.747-3.518s6.671 1.176 9.748 3.518c8.576 6.538 14.934 16.951 13.821 40.498a5.95 5.95 0 003.84 5.845zM126 0c14.042.377 28.119 3.103 40.336 8.406 8.46 3.677 16.354 8.534 23.502 14.342 3.228 2.622 5.886 5.155 8.814 8.071 7.897.273 19.438-8.5 24.796-16.709-9.221 30.23-51.299 65.929-80.43 79.589-.012-.005-.02-.012-.029-.018-5.228-3.992-11.108-5.988-16.989-5.988s-11.76 1.996-16.988 5.988c-.009.005-.017.014-.029.018-29.132-13.66-71.209-49.359-80.43-79.589 5.357 8.209 16.898 16.982 24.795 16.709 2.929-2.915 5.587-5.449 8.814-8.071C69.31 16.94 77.204 12.083 85.664 8.406 97.882 3.103 111.959.377 126 0m-25.818 106.866c-9.176-4.576-20.854-11.312-32.544-20.541-2.465 5.119-2.735 9.586-1.466 13.193.901 2.542 2.597 4.753 4.826 6.512 2.416 1.901 5.432 3.285 8.766 4.033 6.326 1.425 13.711.593 20.418-3.197"/>
              <path d="M197.167 75.016c6.436-6.495 12.107-13.684 16.667-20.099l2.316 4.359c7.456 14.917 11.33 29.774 11.33 46.494l-.016 26.532.14 13.754c.54 33.766 7.846 67.929 24.396 99.193l-34.627-27.922-24.501 39.759-25.74-24.231L126 299.604l-41.132-66.748-25.739 24.231-24.501-39.759L0 245.25c16.55-31.264 23.856-65.427 24.397-99.193l.14-13.754-.016-26.532c0-16.721 3.873-31.578 11.331-46.494l2.315-4.359c4.56 6.415 10.23 13.603 16.667 20.099l-2.01 4.175c-3.905 8.109-5.198 17.176-2.156 25.799 1.961 5.554 5.54 10.317 10.154 13.953 4.48 3.531 9.782 5.911 15.333 7.161 3.616.814 7.3 1.149 10.96 1.035-.854 4.841-1.227 9.862-1.251 14.978L53.2 160.984l25.206 14.129a41.926 41.926 0 015.734 3.869c20.781 18.658 33.275 73.855 41.861 100.816 8.587-26.961 21.08-82.158 41.862-100.816a41.865 41.865 0 015.734-3.869l25.206-14.129-32.665-18.866c-.024-5.116-.397-10.137-1.251-14.978 3.66.114 7.344-.221 10.96-1.035 5.551-1.25 10.854-3.63 15.333-7.161 4.613-3.636 8.193-8.399 10.153-13.953 3.043-8.623 1.749-17.689-2.155-25.799l-2.01-4.175z"/>
            </svg>
          </a>
        )}
      </div>

      {/* Right: SOL amount (after fee) */}
      <span className={`font-mono text-sm whitespace-nowrap ${isSelected ? 'text-cleanup-secondary' : 'text-cleanup-text-muted'}`}>
        {(account.rentSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
      </span>
    </div>
  );
};

export default AccountsList;
