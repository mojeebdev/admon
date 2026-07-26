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

async function permittedConversation(conversationId: string, builderId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      connection: { status: 'accepted', OR: [{ senderId: builderId }, { recipientId: builderId }] },
    },
    include: {
      connection: {
        include: {
          sender: { select: { id: true, githubUsername: true, name: true } },
          recipient: { select: { id: true, githubUsername: true, name: true } },
        },
      },
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const builder = await currentBuilder(request);
  if (!builder) return NextResponse.json({ error: 'Connect GitHub and verify a build record first.' }, { status: 401 });
  const { conversationId } = await params;
  const conversation = await permittedConversation(conversationId, builder.id);
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: { sender: { select: { githubUsername: true } } },
  });
  await prisma.message.updateMany({ where: { conversationId: conversation.id, senderId: { not: builder.id }, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ messages, viewerId: builder.id });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const builder = await currentBuilder(request);
  if (!builder) return NextResponse.json({ error: 'Connect GitHub and verify a build record first.' }, { status: 401 });
  const { conversationId } = await params;
  const conversation = await permittedConversation(conversationId, builder.id);
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });

  const { body } = await request.json();
  const messageBody = typeof body === 'string' ? body.trim() : '';
  if (!messageBody || messageBody.length > 1000) return NextResponse.json({ error: 'Messages must be between 1 and 1,000 characters.' }, { status: 400 });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId: conversation.id, senderId: builder.id, body: messageBody },
      include: { sender: { select: { githubUsername: true } } },
    });
    await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    return created;
  });
  return NextResponse.json({ message }, { status: 201 });
}
