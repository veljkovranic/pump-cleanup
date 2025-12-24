/**
 * Header Component
 * 
 * Professional navigation header for PumpCleanup.
 */

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export const Header: React.FC = () => {
  const { disconnect, connected } = useWallet();

  const handleLogoClick = () => {
    if (connected) {
      disconnect();
    }
  };

  return (
    <header className="w-full py-4 px-4 md:px-8 border-b border-cleanup-border/50 backdrop-blur-xl bg-cleanup-dark/90 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={handleLogoClick} 
          className="flex items-center gap-3 text-left hover:opacity-80 transition-all group"
        >
          <img 
            src="/logo.svg" 
            alt="PumpCleanup" 
            className="w-10 h-10 rounded-xl"
          />
          <div className="flex flex-col">
            <h1 className="font-display text-xl font-bold text-white">
              PumpCleanup
            </h1>
            <p className="text-xs text-cleanup-text-muted hidden sm:block">
              Click to disconnect
            </p>
          </div>
        </button>

        {/* Nav + Wallet */}
        <div className="flex items-center gap-6">
          <Link 
            href="/blog" 
            className="text-sm text-cleanup-text-secondary hover:text-white transition-colors hidden sm:block"
          >
            Blog
          </Link>
          <Link 
            href="/faq" 
            className="text-sm text-cleanup-text-secondary hover:text-white transition-colors hidden sm:block"
          >
            FAQ
          </Link>
          <WalletMultiButton className="!bg-cleanup-card !border !border-cleanup-border !rounded-xl !py-2.5 !px-5 !text-white hover:!bg-cleanup-hover hover:!border-cleanup-primary !transition-all !font-medium !text-sm" />
        </div>
      </div>
    </header>
  );
};

export default Header;
