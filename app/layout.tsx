import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Admon - verified GitHub build history on Monad',
  description: 'Turn public GitHub activity into a verifiable onchain build record tied to your wallet.',
  openGraph: {
    title: 'Admon',
    description: 'Verified GitHub build history, minted as a Monad NFT.',
    siteName: 'Admon',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admon',
    description: 'Verified GitHub build history, minted as a Monad NFT.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
