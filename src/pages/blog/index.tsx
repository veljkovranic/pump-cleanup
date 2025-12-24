/**
 * Blog Index Page
 * 
 * Lists all blog posts with a clean, professional design.
 */

import Head from 'next/head';
import Link from 'next/link';

// Blog posts data - could be fetched from Notion API in the future
const blogPosts = [
  {
    slug: 'what-is-solana-rent',
    title: 'What is Solana Rent and Why Are You Paying It?',
    excerpt: 'Learn about Solana\'s rent mechanism, why token accounts lock your SOL, and how to reclaim it.',
    date: '2024-12-24',
    readTime: '5 min read',
    category: 'Education',
  },
];

export default function BlogIndex() {
  return (
    <>
      <Head>
        <title>Blog - Wallet Cleanup</title>
        <meta name="description" content="Learn about Solana, token accounts, rent, and how to optimize your wallet." />
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
              <Link href="/blog" className="text-sm text-white font-medium">
                Blog
              </Link>
              <Link href="/faq" className="text-sm text-cleanup-text-secondary hover:text-white transition-colors">
                FAQ
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Blog
            </h1>
            <p className="text-lg text-cleanup-text-secondary max-w-2xl mx-auto">
              Learn about Solana, token accounts, wallet optimization, and the latest updates from Wallet Cleanup.
            </p>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {blogPosts.map((post) => (
                <Link 
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-cleanup-card border border-cleanup-border rounded-2xl p-6 md:p-8 hover:border-cleanup-primary transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs px-3 py-1 rounded-full bg-cleanup-primary/10 text-cleanup-primary font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-cleanup-text-muted">{post.readTime}</span>
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-cleanup-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-cleanup-text-secondary mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cleanup-text-muted">
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="text-cleanup-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Read more
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty state for when there are more posts */}
            {blogPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-cleanup-text-muted">No blog posts yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

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

