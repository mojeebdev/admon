import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { buildStatsSnapshot, normalizeUsername } from '@/app/lib/github';
import { computeTraits, computeRarityScore } from '@/app/lib/traits';
import { profileMustMatch, readGitHubSession } from '@/app/lib/githubAuth';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = readGitHubSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Connect GitHub to verify your public build history.' }, { status: 401 });
    }

    const username = normalizeUsername((body?.username as string | undefined) || session.login);
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
      return NextResponse.json({ error: 'Invalid GitHub username format' }, { status: 400 });
    }
    const matched = profileMustMatch(req, username);
    if (matched.error) return NextResponse.json({ error: matched.error }, { status: 403 });

    // Build stats from GitHub
    const { user, stats } = await buildStatsSnapshot(username);
    const traits = computeTraits(stats);
    const rarityScore = computeRarityScore(stats);

    // Upsert - if a car already exists for this user, refresh it.
    const car = await prisma.car.upsert({
      where: { githubUsername: username },
      create: {
        githubUsername: username,
        githubId: user.id,
        avatarUrl: user.avatar_url,
        name: user.name,
        bio: user.bio,
        traits: traits as any,
        statsSnapshot: stats as any,
        totalCommits: stats.totalCommits,
        rarityScore,
        rarityTier: traits.rarity,
      },
      update: {
        githubId: user.id,
        avatarUrl: user.avatar_url,
        name: user.name,
        bio: user.bio,
        traits: traits as any,
        statsSnapshot: stats as any,
        totalCommits: stats.totalCommits,
        rarityScore,
        rarityTier: traits.rarity,
      },
    });

    return NextResponse.json({
      id: car.id,
      username: car.githubUsername,
      avatarUrl: car.avatarUrl,
      name: car.name,
      traits,
      stats,
      rarityScore,
      mintedAt: car.mintedAt,
      tokenId: car.tokenId,
      permalink: `/commitcar/${car.githubUsername}`,
    });
  } catch (err: any) {
    console.error('[api/build] error:', err);
    const message = err?.message ?? 'Something went wrong';
    const status = message.includes('not found') ? 404 : message.includes('rate limit') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
