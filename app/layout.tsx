import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Providers } from './providers';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Blindspotlab',
  url: 'https://blindspotlab.xyz',
  founder: {
    '@type': 'Person',
    name: 'Mojeeb Titilayo',
    jobTitle: 'Founder',
    description: 'Mojeeb Titilayo is the founder of Blindspotlab, the organization behind Admon.',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://admon.peerfix.dev'),
  title: 'Admon - verified GitHub build history on Monad',
  description: 'Turn public GitHub activity into a verifiable onchain build record tied to your wallet.',
  applicationName: 'Admon',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
