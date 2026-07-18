import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getTotalMinted } from '@/app/lib/contract';
import { contractAddress, MONAD_EXPLORER_URL } from '@/app/lib/monad';

export const runtime = 'nodejs';
export const revalidate = 15;
export const dynamic = 'force-dynamic';

export async function GET() {
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
      contract: contractAddress(),
      explorer: contractAddress() ? `${MONAD_EXPLORER_URL}/address/${contractAddress()}` : null,
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
