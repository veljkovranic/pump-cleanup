/**
 * PumpCleanup - Main Page
 * 
 * Professional landing page and dApp for reclaiming SOL from empty token accounts.
 * Design inspired by rpcfast.com for a clean, enterprise-grade look.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header, HeroSection, ScannerPanel, Footer, RecentPayouts } from '@/components';
import { getCachedTotalSolPrinted } from '@/components/RecentPayouts';
import { faqs } from './faq';

export default function Home() {
  const { connected } = useWallet();

  return (
    <>
      <Head>
        <title>PumpCleanup - Reclaim SOL From Empty Token Accounts</title>
        <meta name="description" content="Reclaim hidden SOL locked in empty token accounts on Solana. Clean your wallet and get your rent back instantly." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="PumpCleanup - Reclaim SOL From Empty Token Accounts" />
        <meta property="og:description" content="Reclaim hidden SOL locked in empty token accounts on Solana. Clean your wallet and get your rent back instantly." />
        <meta property="og:url" content="https://pumpcleanup.com" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pumpcleanup" />
        <meta name="twitter:title" content="PumpCleanup - Reclaim SOL From Empty Token Accounts" />
        <meta name="twitter:description" content="Reclaim hidden SOL locked in empty token accounts on Solana." />
      </Head>

      <div className="min-h-screen flex flex-col bg-cleanup-dark relative overflow-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-cleanup-primary/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cleanup-secondary/5 rounded-full blur-[120px]" />
          
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1b2308_1px,transparent_1px),linear-gradient(to_bottom,#1a1b2308_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {connected && <Header />}

          <main className="flex-1 flex flex-col items-center">
            {connected ? (
              <>
                <ScannerPanel />
                <RecentPayouts />
              </>
            ) : (
              <>
                <HeroSection />
                <RecentPayouts />
                <StatsSection />
                <FeaturesSection />
                <HowItWorksSection />
                <FAQSection />
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}

/**
 * Stats section showing key metrics.
 */
const StatsSection: React.FC = () => {
  const [totalSol, setTotalSol] = useState(0);

  useEffect(() => {
    const updateTotal = () => setTotalSol(getCachedTotalSolPrinted());
    updateTotal();
    const interval = setInterval(updateTotal, 2000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      value: totalSol > 0 ? `${totalSol.toFixed(2)}+` : '---', 
      label: 'SOL Reclaimed',
      suffix: totalSol > 0 ? '' : ''
    },
    { value: '~0.002', label: 'SOL per Account', suffix: '' },
    { value: '10%', label: 'Service Fee', suffix: '' },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-3xl md:text-4xl font-bold font-display gradient-text mb-2">
              {stat.value}{stat.suffix}
            </div>
            <div className="text-sm text-cleanup-text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Features section explaining key benefits.
 */
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Recover Hidden SOL',
      description: 'Each empty token account has ~0.002 SOL locked as rent. We help you get it back.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      title: 'Clean Wallet',
      description: 'Remove old token accounts from swaps, NFT mints, and rugged projects.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant & Secure',
      description: 'Transactions are processed immediately. Your wallet, your control.',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
          Why Use PumpCleanup?
        </h2>
        <p className="text-cleanup-text-secondary max-w-2xl mx-auto">
          Every token transaction on Solana creates accounts that lock SOL. Most users don&apos;t know they have hundreds of SOL worth of refunds waiting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <div 
            key={i} 
            className="bg-cleanup-card border border-cleanup-border rounded-2xl p-6 card-hover"
          >
            <div className="w-12 h-12 rounded-xl bg-cleanup-primary/10 text-cleanup-primary flex items-center justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">{feature.title}</h3>
            <p className="text-cleanup-text-secondary text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * How it works section.
 */
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Connect Wallet',
      description: 'Connect your Solana wallet securely. We support Phantom, Solflare, and more.',
    },
    {
      step: '02',
      title: 'Scan Accounts',
      description: 'We automatically find all empty token accounts with reclaimable rent.',
    },
    {
      step: '03',
      title: 'Reclaim SOL',
      description: 'Close empty accounts in one click and receive your SOL instantly.',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
          How It Works
        </h2>
        <p className="text-cleanup-text-secondary max-w-2xl mx-auto">
          Reclaim your SOL in three simple steps. No technical knowledge required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((item, i) => (
          <div key={i} className="relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-cleanup-primary/50 to-cleanup-secondary/50" />
            )}
            
            <div className="relative bg-cleanup-card border border-cleanup-border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cleanup-primary to-cleanup-secondary flex items-center justify-center">
                <span className="text-2xl font-bold text-white font-display">{item.step}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-display">{item.title}</h3>
              <p className="text-cleanup-text-secondary text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * FAQ Section on home page
 */
const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16 mb-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-cleanup-text-secondary max-w-2xl mx-auto">
          Everything you need to know about recovering your SOL
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-cleanup-card border border-cleanup-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-cleanup-hover/30 transition-colors"
            >
              <h3 className="font-display text-base font-semibold text-white pr-4">
                {faq.question}
              </h3>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-cleanup-border flex items-center justify-center transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                <svg className="w-3.5 h-3.5 text-cleanup-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {openIndex === index && (
              <div className="px-5 pb-5">
                <div className="text-cleanup-text-secondary text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link 
          href="/faq"
          className="text-cleanup-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
        >
          View all FAQs
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
};
