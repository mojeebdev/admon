import { NextRequest, NextResponse } from 'next/server';
import { readGitHubSession } from '@/app/lib/githubAuth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = readGitHubSession(request);
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    login: session.login,
    avatarUrl: session.avatarUrl,
    name: session.name,
  });
}
