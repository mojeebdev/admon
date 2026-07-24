import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string; weekKey: string }> },
) {
  const { username, weekKey } = await params;
  const builder = await prisma.builder.findFirst({ where: { githubUsername: { equals: username, mode: 'insensitive' } } });
  if (!builder) return NextResponse.json({ error: 'Builder not found.' }, { status: 404 });
  const record = await prisma.buildRecord.findUnique({ where: { builderId_weekKey: { builderId: builder.id, weekKey } } });
  if (!record) return NextResponse.json({ error: 'Build record not found.' }, { status: 404 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://admon.peerfix.dev').replace(/\/$/, '');
  return NextResponse.json({
    name: `Admon Trace | @${builder.githubUsername} | ${record.weekKey}`,
    description: `Verified public GitHub build record for @${builder.githubUsername}, created for ${record.weekKey} on Monad.`,
    external_url: `${appUrl}/builder/${encodeURIComponent(builder.githubUsername)}`,
    image: `${appUrl}/api/weekly-image/${encodeURIComponent(builder.githubUsername)}/${record.weekKey}`,
    attributes: [
      { trait_type: 'Builder', value: builder.githubUsername },
      { trait_type: 'Weekly period', value: record.weekKey },
      { trait_type: 'Rarity', value: record.rarityTier },
      { trait_type: 'Build score', value: record.rarityScore },
      { trait_type: 'Collection', value: 'Admon Trace' },
    ],
  });
}
