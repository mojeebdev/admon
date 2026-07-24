import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getTotalMinted } from '@/app/lib/contract';
import { contractAddress, MONAD_EXPLORER_URL, weeklyContractAddress } from '@/app/lib/monad';

export const runtime = 'nodejs';
export const revalidate = 15;
export const dynamic = 'force-dynamic';

function explorerFor(address: `0x${string}` | undefined) {
  return address ? `${MONAD_EXPLORER_URL}/address/${address}` : null;
}

export async function GET() {
  const v1 = contractAddress();
  const v2 = weeklyContractAddress();

  const [totalBuilt, totalMinted, onChainMinted, lastMint] = await Promise.all([
    prisma.car.count(),
    prisma.car.count({ where: { mintedAt: { not: null } } }),
    getTotalMinted(),
    prisma.car.findFirst({
      where: { mintedAt: { not: null } },
      orderBy: { mintedAt: 'desc' },
      select: {
        githubUsername: true,
        tokenId: true,
        mintTxHash: true,
        mintedAt: true,
      },
    }),
  ]);

  return NextResponse.json(
    {
      totalBuilt,
      totalMinted,
      onChainMinted,
      // Backward-compatible aliases for V1
      contract: v1,
      explorer: explorerFor(v1),
      contractV1: v1,
      explorerV1: explorerFor(v1),
      contractV2: v2,
      explorerV2: explorerFor(v2),
      lastMint: lastMint ? {
        username: lastMint.githubUsername,
        tokenId: lastMint.tokenId,
        txHash: lastMint.mintTxHash,
        mintedAt: lastMint.mintedAt,
      } : null,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } }
  );
}
