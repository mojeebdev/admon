'use client';

import { useEffect, useRef, useState } from 'react';
import { useConnect, useConnectors, useConnection, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { MONAD_CHAIN } from '@/app/lib/monad';

const WEEKLY_ABI = [{
  type: 'function',
  name: 'mint',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'username', type: 'string' },
    { name: 'weekKey', type: 'string' },
    { name: 'traitsHash', type: 'bytes32' },
    { name: 'deadline', type: 'uint256' },
    { name: 'authorization', type: 'bytes' },
  ],
  outputs: [{ name: 'tokenId', type: 'uint256' }],
}] as const;

type Authorization = {
  weekKey: string;
  traitsHash: `0x${string}`;
  deadline: string;
  signature: `0x${string}`;
};

export function WeeklyMintButton({ username, contractAddress }: { username: string; contractAddress?: `0x${string}` }) {
  const [authorizing, setAuthorizing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [pendingWallet, setPendingWallet] = useState(false);
  const [authorization, setAuthorization] = useState<Authorization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const finalizedHash = useRef<string | null>(null);
  const { address, chainId, status } = useConnection();
  const { mutate: connect, isPending: connecting } = useConnect();
  const connectors = useConnectors();
  const { mutate: switchChain, isPending: switching } = useSwitchChain();
  const { mutate: writeContract, data: txHash, isPending: signing, error: writeError, reset } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash, chainId: MONAD_CHAIN.id });
  const isConnected = status === 'connected';

  useEffect(() => {
    fetch('/api/github/session')
      .then((response) => response.json())
      .then((session) => setGithubLogin(session.authenticated ? session.login : null))
      .catch(() => setGithubLogin(null));
  }, []);

  async function authorizeAndMint() {
    if (!address || !contractAddress) return;
    setAuthorizing(true);
    setError(null);
    reset();
    try {
      const response = await fetch('/api/weekly-mint-authorization', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, ownerAddress: address }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not authorize this weekly mint.');
      const nextAuthorization = payload as Authorization;
      setAuthorization(nextAuthorization);
      writeContract({
        address: contractAddress, abi: WEEKLY_ABI, functionName: 'mint',
        args: [username, nextAuthorization.weekKey, nextAuthorization.traitsHash, BigInt(nextAuthorization.deadline), nextAuthorization.signature],
        chainId: MONAD_CHAIN.id,
      });
    } catch (mintError) {
      setError(mintError instanceof Error ? mintError.message : 'Could not authorize this weekly mint.');
    } finally {
      setAuthorizing(false);
    }
  }

  useEffect(() => {
    if (pendingWallet && isConnected && chainId === MONAD_CHAIN.id) {
      setPendingWallet(false);
      void authorizeAndMint();
    }
    // The current username and wallet are deliberately used after connection settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingWallet, isConnected, chainId]);

  useEffect(() => {
    if (!isSuccess || !txHash || !address || !authorization || finalizedHash.current === txHash) return;
    finalizedHash.current = txHash;
    setFinalizing(true);
    fetch('/api/weekly-finalize-mint', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, weekKey: authorization.weekKey, txHash, ownerAddress: address }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Mint confirmed but could not be recorded.');
      })
      .then(() => window.location.reload())
      .catch((finalizeError) => { setFinalizing(false); setError(finalizeError instanceof Error ? finalizeError.message : 'Mint confirmed but could not be recorded.'); });
  }, [address, authorization, isSuccess, txHash, username]);

  function handleMint() {
    setError(null);
    if (!contractAddress) return;
    if (!isConnected) {
      const connector = connectors[0];
      if (!connector) return setError('No browser wallet was found. Install or unlock a wallet, then try again.');
      setPendingWallet(true);
      connect({ connector, chainId: MONAD_CHAIN.id });
      return;
    }
    if (chainId !== MONAD_CHAIN.id) {
      setPendingWallet(true);
      switchChain({ chainId: MONAD_CHAIN.id });
      return;
    }
    void authorizeAndMint();
  }

  if (!contractAddress) return <span className="connection-control__state">Admon Trace will open after the collection is deployed.</span>;
  if (githubLogin?.toLowerCase() !== username.toLowerCase()) {
    if (!githubLogin) return <a className="btn-primary" href={`/api/github/login?returnTo=/builder/${encodeURIComponent(username)}`}>Connect GitHub for Friday mint</a>;
    return <span className="connection-control__state">Only @{username} can mint this weekly build record.</span>;
  }
  const busy = pendingWallet || connecting || switching || authorizing || signing || waiting || finalizing;
  const label = !isConnected ? 'Connect wallet for Friday mint' : chainId !== MONAD_CHAIN.id ? 'Switch to Monad' : authorizing ? 'Checking Friday record…' : signing ? 'Confirm in wallet…' : waiting ? 'Confirming on Monad…' : finalizing ? 'Recording weekly proof…' : 'Mint Friday build record';
  const writeMessage = writeError?.message.toLowerCase().includes('user rejected') ? 'Transaction cancelled in your wallet.' : writeError?.message.split('\n')[0];

  return (
    <div className="weekly-mint">
      <button type="button" className="btn-primary" onClick={handleMint} disabled={busy}>{label}</button>
      <p>Only the connected GitHub owner can mint one current record each Friday UTC.</p>
      {(error || writeMessage) && <p className="weekly-mint__error" role="alert">{error || writeMessage}</p>}
    </div>
  );
}
