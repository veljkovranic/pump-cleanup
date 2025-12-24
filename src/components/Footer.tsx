/**
 * Footer Component
 * 
 * Professional footer for PumpCleanup.
 */

import React from 'react';
import Link from 'next/link';
import { SOLANA_NETWORK } from '@/lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 px-4 border-t border-cleanup-border/50 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/logo.svg" 
              alt="PumpCleanup" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-display font-semibold text-white">PumpCleanup</span>
          </Link>

          {/* Network Status */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${SOLANA_NETWORK === 'mainnet-beta' ? 'bg-cleanup-secondary' : 'bg-cleanup-warning'} animate-pulse`} />
            <span className="text-cleanup-text-muted">
              {SOLANA_NETWORK === 'mainnet-beta' ? 'Mainnet' : SOLANA_NETWORK.charAt(0).toUpperCase() + SOLANA_NETWORK.slice(1)}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-cleanup-text-secondary">
            <Link
              href="/blog"
              className="hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className="hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <a
              href="https://x.com/pumpcleanup"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-cleanup-text-muted">
          PumpCleanup is provided as-is. Always verify transactions before signing.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
