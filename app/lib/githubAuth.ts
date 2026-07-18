import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'admon_github_session';
const STATE_COOKIE = 'admon_github_oauth_state';

export interface GitHubSession {
  id: number;
  login: string;
  avatarUrl: string;
  name: string | null;
  issuedAt: number;
}

function secret() {
  const value = process.env.GITHUB_SESSION_SECRET || process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!value) throw new Error('GitHub session signing is not configured');
  return value;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function encode(value: object) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decode<T>(value: string | undefined): T | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function createOAuthState(returnTo: string) {
  return encode({
    returnTo: returnTo.startsWith('/') ? returnTo : '/',
    nonce: crypto.randomUUID(),
    issuedAt: Date.now(),
  });
}

export function readOAuthState(value: string | undefined) {
  const state = decode<{ returnTo: string; nonce: string; issuedAt: number }>(value);
  if (!state || Date.now() - state.issuedAt > 10 * 60 * 1000) return null;
  return state;
}

export function createGitHubSession(user: Omit<GitHubSession, 'issuedAt'>) {
  return encode({ ...user, issuedAt: Date.now() });
}

export function readGitHubSession(request: NextRequest): GitHubSession | null {
  const session = decode<GitHubSession>(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session || Date.now() - session.issuedAt > 7 * 24 * 60 * 60 * 1000) return null;
  return session;
}

export const githubSessionCookie = {
  name: SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  },
};

export const oauthStateCookie = {
  name: STATE_COOKIE,
  options: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  },
};

export function profileMustMatch(request: NextRequest, username: string) {
  const session = readGitHubSession(request);
  if (!session) return { session: null, error: 'Connect GitHub to verify this build history.' };
  if (session.login.toLowerCase() !== username.toLowerCase()) {
    return { session: null, error: 'Your connected GitHub account does not match this build history.' };
  }
  return { session, error: null };
}
