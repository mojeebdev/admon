'use client';

import { useConnect, useConnectors, useConnection, useDisconnect } from 'wagmi';
import { MONAD_CHAIN } from '@/app/lib/monad';

export function WalletConnect() {
  const { address, chainId, status } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  const connector = connectors[0];
  const isConnected = status === 'connected';

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
