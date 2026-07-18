import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { generateCarPng } from '@/app/lib/imageGen';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) {
    return new NextResponse('Not found', { status: 404 });
  }

  const png = await generateCarPng(car);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}