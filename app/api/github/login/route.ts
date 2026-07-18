import { NextRequest, NextResponse } from 'next/server';
import { appUrl } from '@/app/lib/monad';
import { createOAuthState, oauthStateCookie } from '@/app/lib/githubAuth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/?oauth=configuration', request.url));
  }

  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/';
  const state = createOAuthState(returnTo);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${appUrl()}/api/github/callback`);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookie.name, state, oauthStateCookie.options);
  return response;
}
