import { NextRequest, NextResponse } from 'next/server';
import { getAddress, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { fridayWeekKey } from '@/app/lib/builders';
import { buildStatsSnapshot } from '@/app/lib/github';
import { profileMustMatch } from '@/app/lib/githubAuth';
import { MONAD_CHAIN, weeklyContractAddress } from '@/app/lib/monad';
import { prisma } from '@/app/lib/prisma';
import { computeRarityScore, computeTraits, hashTraits } from '@/app/lib/traits';

export const runtime = 'nodejs';

const mintTypes = {
  Mint: [
    { name: 'recipient', type: 'address' },
    { name: 'username', type: 'string' },
    { name: 'weekKey', type: 'string' },
    { name: 'traitsHash', type: 'bytes32' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export async function POST(request: NextRequest) {
  try {
    const { username, ownerAddress } = await request.json();
    if (!username || !isAddress(ownerAddress)) {
      return NextResponse.json({ error: 'A GitHub profile and valid wallet address are required.' }, { status: 400 });
    }
    const verified = profileMustMatch(request, username);
    if (verified.error) return NextResponse.json({ error: verified.error }, { status: 401 });

    const weekKey = fridayWeekKey();
    if (!weekKey) return NextResponse.json({ error: 'A new build record can be minted on Friday UTC only.' }, { status: 403 });

    const contract = weeklyContractAddress();
    const privateKey = process.env.MONAD_TRACE_AUTHORIZER_PRIVATE_KEY || process.env.MONAD_V2_AUTHORIZER_PRIVATE_KEY || process.env.MONAD_AUTHORIZER_PRIVATE_KEY;
    if (!contract || !privateKey) return NextResponse.json({ error: 'The weekly Admon collection is not configured yet.' }, { status: 503 });

    const { user, stats } = await buildStatsSnapshot(username);
    const traits = computeTraits(stats);
    const rarityScore = computeRarityScore(stats);
    const builder = await prisma.builder.upsert({
      where: { githubUsername: username },
      create: { githubUsername: username, githubId: user.id, avatarUrl: user.avatar_url, name: user.name, bio: user.bio },
      update: { githubId: user.id, avatarUrl: user.avatar_url, name: user.name, bio: user.bio },
    });
    const existing = await prisma.buildRecord.findUnique({ where: { builderId_weekKey: { builderId: builder.id, weekKey } } });
    if (existing?.mintedAt) return NextResponse.json({ error: 'This Friday build record has already been minted.' }, { status: 409 });

    const record = await prisma.buildRecord.upsert({
      where: { builderId_weekKey: { builderId: builder.id, weekKey } },
      create: { builderId: builder.id, weekKey, traits: traits as object, statsSnapshot: stats as object, totalCommits: stats.totalCommits, rarityScore, rarityTier: traits.rarity },
      update: { traits: traits as object, statsSnapshot: stats as object, totalCommits: stats.totalCommits, rarityScore, rarityTier: traits.rarity },
    });

    const traitsHash = hashTraits(traits);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const signature = await account.signTypedData({
      domain: { name: 'Admon Trace', version: '1', chainId: MONAD_CHAIN.id, verifyingContract: contract },
      types: mintTypes,
      primaryType: 'Mint',
      message: { recipient: getAddress(ownerAddress), username, weekKey, traitsHash, deadline },
    });

    return NextResponse.json({ recordId: record.id, weekKey, traitsHash, deadline: deadline.toString(), signature });
  } catch (error) {
    console.error('[weekly-mint-authorization]', error);
    return NextResponse.json({ error: 'Could not create the weekly mint authorization.' }, { status: 500 });
  }
}
