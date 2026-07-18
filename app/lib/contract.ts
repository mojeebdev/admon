import { createPublicClient, http } from 'viem';
import { contractAddress, MONAD_CHAIN } from './monad';

const ADMON_ABI = [
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const client = createPublicClient({
  chain: MONAD_CHAIN,
  transport: http(MONAD_CHAIN.rpcUrls.default.http[0]),
});

export async function getTotalMinted(): Promise<number> {
  const contract = contractAddress();
  if (!contract || contract === '0x0000000000000000000000000000000000000000') return 0;
  try {
    const total = await client.readContract({
      address: contract,
      abi: ADMON_ABI,
      functionName: 'totalSupply',
    });
    return Number(total);
  } catch (e) {
    console.error('[contract] totalSupply read failed:', e);
    return 0;
  }
}
