import { NextRequest, NextResponse } from 'next/server';
import { ensureBuilderForUsername } from '@/app/lib/builders';
import { readGitHubSession } from '@/app/lib/githubAuth';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

async function currentBuilder(request: NextRequest) {
  const session = readGitHubSession(request);
  if (!session) return { session: null, builder: null };
  return { session, builder: await ensureBuilderForUsername(session.login) };
}

export async function GET(request: NextRequest) {
  const { session, builder } = await currentBuilder(request);
  const targetUsername = request.nextUrl.searchParams.get('target');
  const inbox = request.nextUrl.searchParams.get('inbox') === '1';

  if (!session) return NextResponse.json({ authenticated: false });
  if (!builder) return NextResponse.json({ authenticated: true, profileEligible: false });

  if (inbox) {
    const requests = await prisma.connectionRequest.findMany({
      where: { recipientId: builder.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { githubUsername: true, name: true, avatarUrl: true } } },
    });
    return NextResponse.json({ authenticated: true, profileEligible: true, ownerUsername: builder.githubUsername, requests });
  }

  if (!targetUsername) return NextResponse.json({ authenticated: true, profileEligible: true });
  const target = await ensureBuilderForUsername(targetUsername);
  if (!target) return NextResponse.json({ authenticated: true, profileEligible: true, targetFound: false });
  if (target.id === builder.id) return NextResponse.json({ authenticated: true, profileEligible: true, ownProfile: true });

  const requestState = await prisma.connectionRequest.findFirst({
    where: {
      OR: [
        { senderId: builder.id, recipientId: target.id },
        { senderId: target.id, recipientId: builder.id },
      ],
    },
  });
  return NextResponse.json({
    authenticated: true,
    profileEligible: true,
    targetFound: true,
    status: requestState?.status || null,
    direction: requestState?.senderId === builder.id ? 'sent' : 'received',
  });
}

export async function POST(request: NextRequest) {
  const { session, builder } = await currentBuilder(request);
  if (!session) return NextResponse.json({ error: 'Connect GitHub before sending a builder request.' }, { status: 401 });
  if (!builder) return NextResponse.json({ error: 'Verify your own build record before connecting with other builders.' }, { status: 403 });

  const body = await request.json();
  const username = typeof body?.username === 'string' ? body.username : '';
  const target = await ensureBuilderForUsername(username);
  if (!target) return NextResponse.json({ error: 'That builder profile was not found.' }, { status: 404 });
  if (target.id === builder.id) return NextResponse.json({ error: 'You cannot send a connection request to yourself.' }, { status: 400 });

  const reverse = await prisma.connectionRequest.findUnique({
    where: { senderId_recipientId: { senderId: target.id, recipientId: builder.id } },
  });
  if (reverse?.status === 'accepted') return NextResponse.json({ status: 'accepted' });
  if (reverse?.status === 'pending') return NextResponse.json({ error: 'This builder has already sent you a request. Open your profile to respond.' }, { status: 409 });

  const connection = await prisma.connectionRequest.upsert({
    where: { senderId_recipientId: { senderId: builder.id, recipientId: target.id } },
    create: { senderId: builder.id, recipientId: target.id },
    update: { status: 'pending', respondedAt: null },
  });
  return NextResponse.json({ status: connection.status });
}

export async function PATCH(request: NextRequest) {
  const { builder } = await currentBuilder(request);
  if (!builder) return NextResponse.json({ error: 'Only verified builders can respond to requests.' }, { status: 401 });

  const body = await request.json();
  const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
  const action = body?.action === 'accept' ? 'accepted' : body?.action === 'decline' ? 'declined' : null;
  if (!requestId || !action) return NextResponse.json({ error: 'Choose accept or decline.' }, { status: 400 });

  const connection = await prisma.connectionRequest.findFirst({ where: { id: requestId, recipientId: builder.id, status: 'pending' } });
  if (!connection) return NextResponse.json({ error: 'That pending request was not found.' }, { status: 404 });

  await prisma.connectionRequest.update({
    where: { id: connection.id },
    data: { status: action, respondedAt: new Date() },
  });
  return NextResponse.json({ status: action });
}
