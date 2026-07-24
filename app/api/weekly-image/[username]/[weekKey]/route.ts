import { NextRequest } from 'next/server';
import { generateCarPng } from '@/app/lib/imageGen';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string; weekKey: string }> },
) {
  const { username, weekKey } = await params;
  const builder = await prisma.builder.findFirst({ where: { githubUsername: { equals: username, mode: 'insensitive' } } });
  if (!builder) return new Response('Builder not found', { status: 404 });
  const record = await prisma.buildRecord.findUnique({ where: { builderId_weekKey: { builderId: builder.id, weekKey } } });
  if (!record) return new Response('Build record not found', { status: 404 });

  const png = await generateCarPng({ githubUsername: builder.githubUsername, traits: record.traits, statsSnapshot: record.statsSnapshot });
  const body = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
  return new Response(body, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
