/**
 * Custom Document
 * 
 * Customizes the HTML document structure.
 * Adds custom fonts and meta tags.
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts - Inter, Space Grotesk, and JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        
        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧹</text></svg>" />
        
        {/* Meta tags */}
        <meta name="description" content="Reclaim hidden SOL locked in empty token accounts on Solana. Clean your wallet and get your rent back instantly." />
        <meta name="theme-color" content="#4f8fff" />
        
        {/* Open Graph */}
        <meta property="og:title" content="PumpCleanup - Reclaim SOL" />
        <meta property="og:description" content="Reclaim hidden SOL locked in empty token accounts on Solana. Clean your wallet instantly." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pumpcleanup.com" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pumpcleanup" />
        <meta name="twitter:title" content="PumpCleanup - Reclaim SOL" />
        <meta name="twitter:description" content="Reclaim hidden SOL locked in empty token accounts on Solana." />
        
        {/* Microsoft Clarity */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "ujx903vo4y");
            `,
          }}
        />
      </Head>
      <body className="bg-cleanup-dark text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
