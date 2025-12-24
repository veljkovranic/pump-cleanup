/**
 * HeroSection Component
 * 
 * Professional landing page hero inspired by rpcfast.com
 * Clean design with clear value proposition and CTA.
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PublicKey } from '@solana/web3.js';
import { scanWalletForCloseableAccounts, ScanResult, shortenAddress } from '@/lib/solana';
import { FEE_PERCENTAGE } from '@/lib/constants';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Rate limiting cache
const RATE_LIMIT_MS = 5 * 60 * 1000;
const scanCache = new Map<string, { result: ScanResult; timestamp: number }>();

export const HeroSection: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [address, setAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address.trim());
    } catch {
      setError('Invalid Solana address');
      return;
    }

    const walletAddress = pubkey.toBase58();
    const cached = scanCache.get(walletAddress);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - cached.timestamp)) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      setScanResult(cached.result);
      setError(`Using cached result. Refresh available in ${minutes}m ${seconds}s`);
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await scanWalletForCloseableAccounts(pubkey);
      setScanResult(result);
      scanCache.set(walletAddress, { result, timestamp: now });
    } catch (err: any) {
      setError(err?.message || 'Failed to scan wallet');
    } finally {
      setIsScanning(false);
    }
  }, [address]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan();
    }
  };

  const totalSol = scanResult?.totalReclaimableSol || 0;
  const accountCount = scanResult?.closeableAccounts.length || 0;

  return (
    <>
      {/* Landing Page Header */}
      <header className="w-full py-4 px-4 md:px-8 border-b border-cleanup-border/50 backdrop-blur-xl bg-cleanup-dark/90 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
            <img 
              src="/logo.svg" 
              alt="Wallet Cleanup" 
              className="w-10 h-10 rounded-xl"
            />
            <span className="font-display text-xl font-bold text-white">
              Wallet Cleanup
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link 
              href="/blog" 
              className="text-sm text-cleanup-text-secondary hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link 
              href="/faq" 
              className="text-sm text-cleanup-text-secondary hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <WalletMultiButton className="!bg-cleanup-card !border !border-cleanup-border !rounded-xl !py-2.5 !px-5 !text-white hover:!bg-cleanup-hover hover:!border-cleanup-primary !transition-all !font-medium !text-sm" />
          </nav>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center py-12 md:py-20 px-4 relative">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cleanup-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cleanup-secondary/10 rounded-full blur-[100px]" />
        </div>

        {/* Badge */}
       

        {/* Main Headline */}
        <h1 className="relative font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl leading-tight">
          <span className="text-white">Reclaim Hidden </span>
          <span className="gradient-text">SOL</span>
          <span className="text-white">.</span>
          <br />
          <span className="text-white">Clean Your </span>
          <span className="gradient-text">Wallet</span>
          <span className="text-white">.</span>
        </h1>

        {/* Subtitle */}
        <p className="relative text-lg md:text-xl text-cleanup-text-secondary mb-8 max-w-2xl leading-relaxed">
          Every token account on Solana locks ~<span className="text-cleanup-primary font-semibold">0.002 SOL</span> as rent. 
          Selling tokens doesn&apos;t return it. We help you close empty accounts and get your SOL back—safely and instantly.
        </p>

        {/* CTA Area */}
        {!showScanner ? (
          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-cleanup-primary !to-cleanup-secondary !text-white !font-semibold !py-4 !px-8 !rounded-xl !text-base hover:!opacity-90 !transition-all !shadow-lg !shadow-cleanup-primary/30" />
            <button
              onClick={() => setShowScanner(true)}
              className="py-4 px-8 rounded-xl font-medium text-cleanup-text-secondary hover:text-white border border-cleanup-border hover:border-cleanup-primary transition-all"
            >
              Check Any Wallet
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-xl">
            {/* Search Box */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address..."
                className="flex-1 bg-cleanup-card border border-cleanup-border rounded-xl px-5 py-4 text-white placeholder-cleanup-text-muted focus:outline-none focus:border-cleanup-primary transition-colors"
                disabled={isScanning}
              />
              <button
                onClick={handleScan}
                disabled={isScanning || !address.trim()}
                className="px-6 py-4 bg-gradient-to-r from-cleanup-primary to-cleanup-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? '...' : 'Scan'}
              </button>
            </div>

            {/* Connect Wallet option */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-cleanup-text-muted text-sm">or</span>
              <WalletMultiButton className="!bg-transparent !border !border-cleanup-primary !text-cleanup-primary !font-medium !py-2.5 !px-5 !rounded-xl !text-sm hover:!bg-cleanup-primary/10 !transition-all" />
            </div>

            {error && (
              <p className="text-cleanup-error text-sm mb-3">{error}</p>
            )}

            {/* Result inline */}
            {scanResult && !isScanning && (
              <div className="bg-cleanup-card border border-cleanup-border rounded-xl p-5">
                {accountCount > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-cleanup-border">
                      <span className="text-cleanup-text-secondary text-sm">Reclaimable SOL:</span>
                      <span className="text-2xl font-bold text-cleanup-secondary font-display">
                        {(totalSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
                      </span>
                    </div>
                    
                    {scanResult.isTruncated && (
                      <div className="bg-cleanup-warning/10 border border-cleanup-warning/30 rounded-lg p-3 mb-4">
                        <p className="text-cleanup-warning text-sm text-center">
                          Found {scanResult.totalCloseableCount} accounts! Showing first 100.
                          <br />
                          <span className="opacity-80">Estimated total: {(scanResult.estimatedTotalSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL</span>
                        </p>
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-2">
                      <p className="text-cleanup-text-muted text-xs mb-2">
                        {scanResult.isTruncated ? `Showing ${accountCount} of ${scanResult.totalCloseableCount}` : `${accountCount} closeable accounts`}:
                      </p>
                      {scanResult.closeableAccounts.filter(a => !a.isDust).slice(0, 20).map((account) => (
                        <div 
                          key={account.address.toBase58()} 
                          className="flex items-center justify-between text-sm py-2 px-3 bg-cleanup-dark/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-cleanup-text-muted">📭</span>
                            <span className="text-cleanup-text-secondary font-mono text-xs">{shortenAddress(account.mint, 4)}</span>
                          </div>
                          <span className="text-cleanup-secondary font-semibold">
                            +{(account.rentSol * (1 - FEE_PERCENTAGE)).toFixed(4)} SOL
                          </span>
                        </div>
                      ))}
                      {accountCount > 20 && (
                        <p className="text-cleanup-text-muted text-xs text-center pt-2">
                          +{accountCount - 20} more accounts...
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-cleanup-text-muted text-center py-4">
                    No closeable accounts found in this wallet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default HeroSection;
