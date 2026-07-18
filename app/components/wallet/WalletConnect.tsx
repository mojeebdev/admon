'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { MONAD_CHAIN } from '@/app/lib/monad';

export function WalletConnect() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  if (!isConnected) {
    return (
      <button
        type="button"
        className="nav-terminal__cta"
        onClick={() => connector && connect({ connector, chainId: MONAD_CHAIN.id })}
        disabled={!connector || isPending}
      >
        {isPending ? '[CONNECTING]' : '[CONNECT]'}
      </button>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}…${address?.slice(-4)}`;
  return (
    <button
      type="button"
      className="nav-terminal__cta nav-terminal__wallet"
      onClick={() => disconnect()}
      title={chainId === MONAD_CHAIN.id ? 'Disconnect wallet' : 'Switch to Monad Mainnet before minting'}
    >
      {shortAddress}
    </button>
  );
}
