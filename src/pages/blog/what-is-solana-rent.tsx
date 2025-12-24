/**
 * Blog Post: What is Solana Rent?
 * 
 * Educational article about Solana's rent mechanism.
 */

import Head from 'next/head';
import Link from 'next/link';

export default function BlogPost() {
  return (
    <>
      <Head>
        <title>What is Solana Rent and Why Are You Paying It? - Wallet Cleanup</title>
        <meta name="description" content="Learn about Solana's rent mechanism, why token accounts lock your SOL, and how to reclaim it." />
        <meta property="og:title" content="What is Solana Rent and Why Are You Paying It?" />
        <meta property="og:description" content="Learn about Solana's rent mechanism and how to reclaim locked SOL." />
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-cleanup-dark">
        {/* Header */}
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
              <Link href="/" className="text-sm text-cleanup-text-secondary hover:text-white transition-colors">
                App
              </Link>
              <Link href="/blog" className="text-sm text-cleanup-text-secondary hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/faq" className="text-sm text-cleanup-text-secondary hover:text-white transition-colors">
                FAQ
              </Link>
            </nav>
          </div>
        </header>

        {/* Article */}
        <article className="py-12 md:py-20 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-cleanup-text-secondary hover:text-white transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>

            {/* Article header */}
            <header className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs px-3 py-1 rounded-full bg-cleanup-primary/10 text-cleanup-primary font-medium">
                  Education
                </span>
                <span className="text-xs text-cleanup-text-muted">5 min read</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                What is Solana Rent and Why Are You Paying It?
              </h1>
              <p className="text-lg text-cleanup-text-secondary">
                Every time you interact with a token on Solana, you&apos;re paying rent. Here&apos;s what that means and how to get your SOL back.
              </p>
              <div className="mt-6 pt-6 border-t border-cleanup-border">
                <time className="text-sm text-cleanup-text-muted">
                  December 24, 2024
                </time>
              </div>
            </header>

            {/* Article content */}
            <div className="prose prose-invert max-w-none">
              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                  Understanding Solana&apos;s Rent Model
                </h2>
                <p className="text-cleanup-text-secondary leading-relaxed mb-4">
                  Solana uses a unique approach to managing on-chain data storage called &quot;rent.&quot; Unlike traditional blockchains where you pay gas fees only for transactions, Solana requires accounts to maintain a minimum balance to store data on the network.
                </p>
                <p className="text-cleanup-text-secondary leading-relaxed">
                  This rent mechanism exists to prevent state bloat—a problem where the blockchain becomes cluttered with unused data, slowing down the network for everyone.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                  Why Token Accounts Lock Your SOL
                </h2>
                <p className="text-cleanup-text-secondary leading-relaxed mb-4">
                  Every time you receive a new token on Solana—whether from a swap, an airdrop, or an NFT mint—a new &quot;token account&quot; is created in your wallet. This account holds your balance of that specific token.
                </p>
                <div className="bg-cleanup-card border border-cleanup-border rounded-xl p-6 my-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cleanup-primary/20 flex items-center justify-center">
                      <span className="text-lg">💡</span>
                    </div>
                    <span className="font-semibold text-white">Key Point</span>
                  </div>
                  <p className="text-cleanup-text-secondary">
                    Each token account requires approximately <span className="text-cleanup-secondary font-semibold">0.00203928 SOL</span> as &quot;rent-exempt&quot; balance. This SOL is locked and cannot be used while the account exists.
                  </p>
                </div>
                <p className="text-cleanup-text-secondary leading-relaxed">
                  The problem? When you sell or transfer all of a token, the account remains—with your SOL still locked inside. Most users don&apos;t realize they have dozens or even hundreds of these empty accounts.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                  How Much SOL Are You Missing?
                </h2>
                <p className="text-cleanup-text-secondary leading-relaxed mb-4">
                  Let&apos;s do the math. If you&apos;ve been active on Solana—trading memecoins, collecting NFTs, or using DeFi—you might have:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-cleanup-text-secondary">
                    <span className="text-cleanup-secondary mt-1">•</span>
                    <span><strong className="text-white">50 empty accounts</strong> = ~0.10 SOL locked</span>
                  </li>
                  <li className="flex items-start gap-3 text-cleanup-text-secondary">
                    <span className="text-cleanup-secondary mt-1">•</span>
                    <span><strong className="text-white">100 empty accounts</strong> = ~0.20 SOL locked</span>
                  </li>
                  <li className="flex items-start gap-3 text-cleanup-text-secondary">
                    <span className="text-cleanup-secondary mt-1">•</span>
                    <span><strong className="text-white">500 empty accounts</strong> = ~1.00 SOL locked</span>
                  </li>
                </ul>
                <p className="text-cleanup-text-secondary leading-relaxed">
                  Heavy traders and NFT collectors can have thousands of accounts, representing significant locked value.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                  How to Reclaim Your SOL
                </h2>
                <p className="text-cleanup-text-secondary leading-relaxed mb-4">
                  The good news: you can close these empty token accounts and get your SOL back. When you close an account, the rent-exempt SOL is returned to your wallet.
                </p>
                <p className="text-cleanup-text-secondary leading-relaxed mb-4">
                  That&apos;s exactly what <Link href="/" className="text-cleanup-primary hover:underline">Wallet Cleanup</Link> does. It scans your wallet, identifies all closeable accounts, and lets you reclaim your SOL in just a few clicks.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                  Is It Safe?
                </h2>
                <p className="text-cleanup-text-secondary leading-relaxed mb-4">
                  Yes! Closing an empty token account is a standard Solana operation. We only close accounts that:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-cleanup-text-secondary">
                    <span className="text-cleanup-secondary mt-1">✓</span>
                    <span>Have a <strong className="text-white">zero token balance</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-cleanup-text-secondary">
                    <span className="text-cleanup-secondary mt-1">✓</span>
                    <span>Are <strong className="text-white">owned by you</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-cleanup-text-secondary">
                    <span className="text-cleanup-secondary mt-1">✓</span>
                    <span>Are <strong className="text-white">not frozen</strong> by the token program</span>
                  </li>
                </ul>
                <p className="text-cleanup-text-secondary leading-relaxed">
                  You always review and approve each transaction before signing. Your wallet, your control.
                </p>
              </section>

              {/* CTA */}
              <section className="bg-gradient-to-br from-cleanup-primary/10 to-cleanup-secondary/10 border border-cleanup-border rounded-2xl p-8 text-center">
                <h3 className="font-display text-2xl font-bold text-white mb-3">
                  Ready to Reclaim Your SOL?
                </h3>
                <p className="text-cleanup-text-secondary mb-6">
                  Connect your wallet and see how much hidden SOL you have.
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cleanup-primary to-cleanup-secondary text-white font-semibold py-3 px-8 rounded-xl hover:opacity-90 transition-all"
                >
                  Launch App
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </section>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-cleanup-border/50">
          <div className="max-w-6xl mx-auto text-center">
            <Link href="/" className="text-cleanup-text-secondary hover:text-white transition-colors text-sm">
              ← Back to Wallet Cleanup
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}

