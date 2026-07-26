import { NextRequest, NextResponse } from 'next/server';
import { ensureBuilderForUsername } from '@/app/lib/builders';
import { readGitHubSession } from '@/app/lib/githubAuth';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

async function currentBuilder(request: NextRequest) {
  const session = readGitHubSession(request);
  if (!session) return null;
  return ensureBuilderForUsername(session.login);
}

export async function GET(request: NextRequest) {
  const builder = await currentBuilder(request);
  if (!builder) return NextResponse.json({ error: 'Connect GitHub and verify a build record first.' }, { status: 401 });

  const connections = await prisma.connectionRequest.findMany({
    where: { status: 'accepted', OR: [{ senderId: builder.id }, { recipientId: builder.id }] },
    orderBy: { updatedAt: 'desc' },
    include: {
      sender: { select: { id: true, githubUsername: true, name: true, avatarUrl: true } },
      recipient: { select: { id: true, githubUsername: true, name: true, avatarUrl: true } },
      conversation: { select: { id: true, updatedAt: true } },
    },
  });

  return NextResponse.json({
    conversations: connections.map((connection) => {
      const other = connection.senderId === builder.id ? connection.recipient : connection.sender;
      return { connectionId: connection.id, conversationId: connection.conversation?.id || null, updatedAt: connection.conversation?.updatedAt || connection.updatedAt, other };
    }),
  });
}

export async function POST(request: NextRequest) {
  const builder = await currentBuilder(request);
  if (!builder) return NextResponse.json({ error: 'Connect GitHub and verify a build record first.' }, { status: 401 });
  const { connectionId } = await request.json();
  if (typeof connectionId !== 'string' || !connectionId) return NextResponse.json({ error: 'A connection is required.' }, { status: 400 });

  const connection = await prisma.connectionRequest.findFirst({
    where: { id: connectionId, status: 'accepted', OR: [{ senderId: builder.id }, { recipientId: builder.id }] },
  });
  if (!connection) return NextResponse.json({ error: 'Only accepted builder connections can start a conversation.' }, { status: 403 });

  const conversation = await prisma.conversation.upsert({
    where: { connectionId: connection.id },
    create: { connectionId: connection.id },
    update: {},
    select: { id: true },
  });
  return NextResponse.json({ conversationId: conversation.id });
}
