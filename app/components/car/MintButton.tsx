'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import type { CarTraits } from '@/app/lib/traits';
import { MONAD_CHAIN, openSeaAssetUrl } from '@/app/lib/monad';

const ADMON_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'username', type: 'string' },
      { name: 'traitsHash', type: 'bytes32' },
      { name: 'tokenURI_', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'authorization', type: 'bytes' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const;

interface MintButtonProps {
  username: string;
  traits: CarTraits;
  alreadyMinted: boolean;
  tokenId: number | null;
  contractAddress: `0x${string}` | undefined;
}

interface MintAuthorization {
  traitsHash: `0x${string}`;
  tokenURI: string;
  deadline: string;
  signature: `0x${string}`;
}

export function MintButton({ username, traits, alreadyMinted, tokenId, contractAddress: contract }: MintButtonProps) {
  const [authorizing, setAuthorizing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [pendingWallet, setPendingWallet] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const finalizedHash = useRef<string | null>(null);

  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContract, data: txHash, isPending: signing, error: writeError, reset } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: MONAD_CHAIN.id,
  });
  if (alreadyMinted && tokenId != null) {
    return (
      <a
        href={contract ? openSeaAssetUrl(contract, tokenId) : 'https://opensea.io/collection/admon'}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost"
      >
        Minted · token #{tokenId}
      </a>
    );
  }

  if (!contract || contract === '0x0000000000000000000000000000000000000000') {
    return (
      <span className="mint-state mint-state--pending">
        Mint contract is not configured yet.
      </span>
    );
  }

  async function requestAuthorization() {
    if (!address || !contract) return;
    setAuthorizing(true);
    setErrorMsg(null);
    reset();
    try {
      const response = await fetch('/api/mint-authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ownerAddress: address, traits }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not authorise this mint.');
      const authorization = payload as MintAuthorization;
      writeContract({
        address: contract,
        abi: ADMON_ABI,
        functionName: 'mint',
        args: [
          username,
          authorization.traitsHash,
          authorization.tokenURI,
          BigInt(authorization.deadline),
          authorization.signature,
        ],
        chainId: MONAD_CHAIN.id,
      });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Could not authorise this mint.');
    } finally {
      setAuthorizing(false);
    }
  }

  useEffect(() => {
    if (pendingWallet && isConnected && chainId === MONAD_CHAIN.id) {
      setPendingWallet(false);
      void requestAuthorization();
    }
    // requestAuthorization intentionally uses current props/address after wallet state settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingWallet, isConnected, chainId]);

  useEffect(() => {
    if (!isSuccess || !txHash || !address || finalizedHash.current === txHash) return;
    finalizedHash.current = txHash;
    setFinalizing(true);
    fetch('/api/finalize-mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, txHash, ownerAddress: address }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Mint confirmed but could not be recorded.');
        return payload;
      })
      .then(() => window.location.reload())
      .catch((error) => {
        setFinalizing(false);
        setErrorMsg(error instanceof Error ? error.message : 'Mint confirmed but could not be recorded.');
      });
  }, [isSuccess, txHash, address, username]);

  function handleMint() {
    setErrorMsg(null);
    if (!isConnected) {
      const connector = connectors[0];
      if (!connector) {
        setErrorMsg('No browser wallet was found. Install or unlock MetaMask, then try again.');
        return;
      }
      setPendingWallet(true);
      connect({ connector, chainId: MONAD_CHAIN.id });
      return;
    }
    if (chainId !== MONAD_CHAIN.id) {
      setPendingWallet(true);
      switchChain({ chainId: MONAD_CHAIN.id });
      return;
    }
    void requestAuthorization();
  }

  const rawWriteError = writeError?.message.toLowerCase();
  const humanError = errorMsg ||
    (rawWriteError?.includes('user rejected') || rawWriteError?.includes('user denied')
      ? 'Transaction cancelled in your wallet.'
      : rawWriteError?.includes('insufficient funds')
        ? 'Your wallet needs MON for gas.'
        : rawWriteError?.includes('authorization')
          ? 'This mint authorization expired. Try again.'
          : writeError?.message.split('\n')[0].slice(0, 160));

  const busy = pendingWallet || connecting || switching || authorizing || signing || waiting || finalizing;
  const label = !isConnected
    ? 'Connect wallet to mint'
    : chainId !== MONAD_CHAIN.id
      ? 'Switch to Monad'
      : authorizing
        ? 'Verifying identity…'
        : signing
          ? 'Confirm in wallet…'
          : waiting
            ? 'Confirming on Monad…'
            : finalizing
              ? 'Recording proof…'
              : 'Mint proof on Monad';

  return (
    <div className="mint-action">
      <button type="button" onClick={handleMint} disabled={busy} className="btn-primary">
        {label}
      </button>
      <p className="mint-state" aria-live="polite">
        {!busy && 'GitHub identity and connected wallet are both bound to this mint.'}
        {pendingWallet && 'Opening your browser wallet…'}
        {authorizing && 'Creating a one-time authorization for this wallet…'}
        {signing && 'Review the transaction in your wallet.'}
        {waiting && 'Monad is confirming the transaction.'}
        {finalizing && 'Saving the onchain receipt and share card.'}
      </p>
      {humanError && <p className="mint-state mint-state--error" role="alert">{humanError}</p>}
    </div>
  );
}
