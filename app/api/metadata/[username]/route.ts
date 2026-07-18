import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';
import { appUrl } from '@/app/lib/monad';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const traits = car.traits as unknown as CarTraits;
  const stats = car.statsSnapshot as unknown as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const base = appUrl();

  return NextResponse.json(
    {
      name: `Admon / @${car.githubUsername}`,
      description: `Verified public GitHub build history for @${car.githubUsername}. ${stats.commits365d.toLocaleString()} commits in the last year, minted on Monad.`,
      image: car.imageUrl || `${base}/api/og/${encodeURIComponent(car.githubUsername)}`,
      external_url: `${base}/commitcar/${encodeURIComponent(car.githubUsername)}`,
      attributes: [
        { trait_type: 'Rarity', value: rarity.label },
        { trait_type: 'Chassis', value: traits.chassis },
        { trait_type: 'Paint treatment', value: traits.paint },
        { trait_type: 'Wheel style', value: traits.wheels },
        { trait_type: 'Aero kit', value: traits.aero },
        { trait_type: 'Headlights', value: traits.headlights },
        { trait_type: 'Finish', value: traits.finish },
        { trait_type: 'Top language', value: stats.topLanguage },
        { display_type: 'number', trait_type: 'Commits (365d)', value: stats.commits365d },
        { display_type: 'number', trait_type: 'Public repos', value: stats.publicRepos },
        { display_type: 'number', trait_type: 'Longest streak (days)', value: stats.longestStreak },
        { display_type: 'number', trait_type: 'Total stars', value: stats.totalStars },
        { display_type: 'number', trait_type: 'Account age (years)', value: Math.floor(stats.accountAgeYears) },
        { display_type: 'number', trait_type: 'Build proof score', value: car.rarityScore },
      ],
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  );
}
