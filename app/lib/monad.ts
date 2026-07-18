import { defineChain } from 'viem';

/**
 * Admon targets Monad Mainnet. The public RPC stays configurable for a
 * managed endpoint, but browser wallets always receive the same chain ID.
 */
export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monadscan',
      url: 'https://monadscan.com',
    },
  },
  testnet: false,
});

export const MONAD_CHAIN = monadMainnet;
export const MONAD_EXPLORER_URL = monadMainnet.blockExplorers.default.url;

export function contractAddress() {
  return process.env.NEXT_ADMON_CONTRACT_ADDRESS as `0x${string}` | undefined;
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
