import { NextRequest, NextResponse } from 'next/server';
import { readGitHubSession } from '@/app/lib/githubAuth';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = readGitHubSession(request);
  if (!session) return NextResponse.json({ authenticated: false });
  const hasAdmonRecord = await prisma.car.findFirst({
    where: { githubUsername: { equals: session.login, mode: 'insensitive' } },
    select: { id: true },
  });
  return NextResponse.json({
    authenticated: true,
    login: session.login,
    avatarUrl: session.avatarUrl,
    name: session.name,
    hasAdmonRecord: Boolean(hasAdmonRecord),
  });
}
