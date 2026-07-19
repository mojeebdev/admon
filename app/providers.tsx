'use client';

import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected } from 'wagmi/connectors/injected';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MONAD_CHAIN } from './lib/monad';

const wagmiConfig = createConfig({
  chains: [MONAD_CHAIN],
  connectors: [injected()],
  transports: {
    [MONAD_CHAIN.id]: http(MONAD_CHAIN.rpcUrls.default.http[0]),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
