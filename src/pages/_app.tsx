/**
 * PumpCleanup - App Root
 * 
 * Sets up the Solana Wallet Adapter providers and global styles.
 */

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useMemo, useEffect } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { RPC_ENDPOINT } from '@/lib/constants';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Declare Clarity global
declare global {
  interface Window {
    clarity?: (action: string, ...args: string[]) => void;
  }
}

/**
 * Main App component with all providers.
 */
export default function App({ Component, pageProps }: AppProps) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletTracker />
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Tracks wallet connection changes and syncs with analytics.
 */
function WalletTracker() {
  const { publicKey, wallet, disconnect, connected } = useWallet();

  useEffect(() => {
    if (typeof window === 'undefined' || !connected || !publicKey) return;

    const connectedAddress = publicKey.toBase58();
    console.log('[WalletTracker] Monitoring wallet:', connectedAddress);

    const provider = (window as any).solflare || (window as any).solana || (window as any).phantom?.solana;
    
    if (!provider) {
      console.log('[WalletTracker] No wallet provider found');
      return;
    }

    const handleAccountChanged = (newPublicKey: any) => {
      if (!newPublicKey) {
        console.log('[WalletTracker] Wallet disconnected externally');
        disconnect();
        return;
      }

      const newAddress = newPublicKey.toBase58 ? newPublicKey.toBase58() : String(newPublicKey);
      
      if (newAddress !== connectedAddress) {
        console.log('[WalletTracker] Account changed from', connectedAddress, 'to', newAddress);
        disconnect();
      }
    };

    if (provider.on) {
      provider.on('accountChanged', handleAccountChanged);
      console.log('[WalletTracker] Listening to accountChanged events');
    }

    return () => {
      if (provider.off) {
        provider.off('accountChanged', handleAccountChanged);
      } else if (provider.removeListener) {
        provider.removeListener('accountChanged', handleAccountChanged);
      }
    };
  }, [connected, publicKey, disconnect]);

  // Clarity analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.clarity) {
      if (publicKey) {
        window.clarity('identify', publicKey.toBase58());
        window.clarity('set', 'wallet', wallet?.adapter?.name || 'unknown');
      } else {
        window.clarity('set', 'wallet', 'disconnected');
      }
    }
  }, [publicKey, wallet]);

  return null;
}
