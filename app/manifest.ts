import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Admon',
    short_name: 'Admon',
    description: 'Verified GitHub build history, minted on Monad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#112c3b',
    theme_color: '#112c3b',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
