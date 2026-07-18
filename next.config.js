/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  serverExternalPackages: ['@resvg/resvg-js'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  outputFileTracingIncludes: {
    '/api/og/**': ['./public/fonts/**/*'],
    '/api/finalize-mint': ['./public/fonts/**/*'],
  },
};

module.exports = nextConfig;
