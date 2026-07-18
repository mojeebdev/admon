import { NextRequest, NextResponse } from 'next/server';
import { appUrl } from '@/app/lib/monad';
import {
  createGitHubSession,
  githubSessionCookie,
  oauthStateCookie,
  readOAuthState,
} from '@/app/lib/githubAuth';

export const runtime = 'nodejs';

interface GitHubIdentity {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
}

function redirect(request: NextRequest, path: string, issue: string) {
  const url = new URL(path, request.url);
  url.searchParams.set('oauth', issue);
  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookie.name, '', { ...oauthStateCookie.options, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  const stateValue = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get(oauthStateCookie.name)?.value;
  const state = stateValue && storedState === stateValue ? readOAuthState(stateValue) : null;

  if (error || !state) return redirect(request, '/', error === 'access_denied' ? 'denied' : 'state');

  const code = request.nextUrl.searchParams.get('code');
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) return redirect(request, state.returnTo, 'configuration');

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${appUrl()}/api/github/callback`,
      }),
      cache: 'no-store',
    });
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token) return redirect(request, state.returnTo, 'token');

    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });
    if (!profileResponse.ok) return redirect(request, state.returnTo, 'profile');
    const profile = (await profileResponse.json()) as GitHubIdentity;

    const response = NextResponse.redirect(new URL(state.returnTo, request.url));
    response.cookies.set(
      githubSessionCookie.name,
      createGitHubSession({
        id: profile.id,
        login: profile.login,
        avatarUrl: profile.avatar_url,
        name: profile.name,
      }),
      githubSessionCookie.options,
    );
    response.cookies.set(oauthStateCookie.name, '', { ...oauthStateCookie.options, maxAge: 0 });
    return response;
  } catch {
    return redirect(request, state.returnTo, 'network');
  }
}
