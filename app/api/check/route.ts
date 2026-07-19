import { NextRequest, NextResponse } from 'next/server';
import { buildStatsSnapshot, normalizeUsername } from '@/app/lib/github';
import { computeRarityScore, computeTraits } from '@/app/lib/traits';

export const runtime = 'nodejs';
export const maxDuration = 30;

const CHECK_WINDOW_MS = 10 * 60 * 1000;
const CHECK_LIMIT = 10;
const checkRequests = new Map<string, number[]>();

function canCheck(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const key = forwarded?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (checkRequests.get(key) || []).filter((time) => now - time < CHECK_WINDOW_MS);
  if (recent.length >= CHECK_LIMIT) return false;
  recent.push(now);
  checkRequests.set(key, recent);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!canCheck(request)) {
      return NextResponse.json({ error: 'Too many profile checks. Please try again in a few minutes.' }, { status: 429 });
    }

    const body = await request.json();
    const username = normalizeUsername((body?.username as string | undefined) || '');

    if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
      return NextResponse.json({ error: 'Enter a valid GitHub username.' }, { status: 400 });
    }

    const { user, stats } = await buildStatsSnapshot(username);
    const traits = computeTraits(stats);

    return NextResponse.json({
      username,
      name: user.name,
      avatarUrl: user.avatar_url,
      stats,
      traits,
      rarityScore: computeRarityScore(stats),
    }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (error: unknown) {
    console.error('[api/check] error:', error);
    const message = error instanceof Error ? error.message : 'Could not check this public GitHub profile.';
    const status = message.includes('not found') ? 404 : message.includes('rate limit') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
