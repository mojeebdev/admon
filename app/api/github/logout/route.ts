import { NextResponse } from 'next/server';
import { githubSessionCookie } from '@/app/lib/githubAuth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(githubSessionCookie.name, '', { ...githubSessionCookie.options, maxAge: 0 });
  return response;
}
