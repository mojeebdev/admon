import { NextRequest, NextResponse } from 'next/server';
import { readGitHubSession } from '@/app/lib/githubAuth';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = readGitHubSession(request);
  if (!session) return NextResponse.json({ authenticated: false });
  const [legacyRecord, builder] = await Promise.all([
    prisma.car.findFirst({ where: { githubUsername: { equals: session.login, mode: 'insensitive' } }, select: { id: true } }),
    prisma.builder.findFirst({ where: { githubUsername: { equals: session.login, mode: 'insensitive' } }, select: { id: true } }),
  ]);
  const unreadMessages = builder ? await prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: builder.id },
      conversation: {
        connection: {
          status: 'accepted',
          OR: [{ senderId: builder.id }, { recipientId: builder.id }],
        },
      },
    },
  }) : 0;
  return NextResponse.json({
    authenticated: true,
    login: session.login,
    avatarUrl: session.avatarUrl,
    name: session.name,
    hasAdmonRecord: Boolean(legacyRecord || builder),
    unreadMessages,
  });
}
