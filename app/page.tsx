'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/app/components/nav/Navbar';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';

interface GitHubIdentity {
  authenticated: boolean;
  login?: string;
  avatarUrl?: string;
  name?: string | null;
}

interface BuildResult {
  username: string;
  traits: CarTraits;
  stats: StatsSnapshot;
  permalink: string;
}

interface PublicCheckResult {
  username: string;
  name: string | null;
  avatarUrl: string;
  traits: CarTraits;
  stats: StatsSnapshot;
  rarityScore: number;
}

interface LiveStats {
  totalBuilt: number;
  totalMinted: number;
  onChainMinted: number;
  contract?: string;
  explorer?: string | null;
  contractV1?: string;
  explorerV1?: string | null;
  contractV2?: string;
  explorerV2?: string | null;
  lastMint?: {
    username: string;
    tokenId: number | null;
    txHash: string | null;
    mintedAt: string;
  } | null;
}

const DEMO_TRAITS: CarTraits = {
  chassis: 'armored',
  paint: 'midnight',
  wheels: 'chrome',
  aero: 'wing',
  headlights: 'laser',
  finish: 'gloss',
  rarity: 'epic',
};

const OAUTH_ERRORS: Record<string, string> = {
  denied: 'GitHub access was not granted. Connect GitHub to verify a build history.',
  state: 'The GitHub sign-in session expired. Please try connecting again.',
  token: 'GitHub did not return an access token. Please try again.',
  profile: 'GitHub could not return your public profile. Please try again.',
  network: 'GitHub could not be reached. Please try again.',
  configuration: 'GitHub OAuth is not configured for this deployment yet.',
};

export default function HomePage() {
  const [identity, setIdentity] = useState<GitHubIdentity | null>(null);
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [building, setBuilding] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [checkUsername, setCheckUsername] = useState('');
  const [checkResult, setCheckResult] = useState<PublicCheckResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const demoCar = useMemo(
    () => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderCarSVG(DEMO_TRAITS, {
      username: 'verified',
      width: 960,
      height: 540,
      showRarityBadge: true,
      background: 'transparent',
    })),
    [],
  );

  const checkedCar = useMemo(() => {
    if (!checkResult) return null;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderCarSVG(checkResult.traits, {
      username: checkResult.username,
      width: 960,
      height: 540,
      showRarityBadge: true,
      background: 'transparent',
    }));
  }, [checkResult]);

  useEffect(() => {
    let active = true;
    const oauthError = new URLSearchParams(window.location.search).get('oauth');
    if (oauthError && OAUTH_ERRORS[oauthError]) setError(OAUTH_ERRORS[oauthError]);
    const loadStats = () => fetch('/api/stats')
      .then((response) => response.ok ? response.json() : null)
      .then((liveStats) => {
        if (active) setStats(liveStats);
      })
      .catch(() => {});

    fetch('/api/github/session')
      .then((response) => response.json())
      .then((session) => {
        if (active) setIdentity(session);
      })
      .catch(() => {
        if (active) setIdentity({ authenticated: false });
      });
    void loadStats();
    const timer = window.setInterval(loadStats, 20_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function verifyBuild() {
    if (!identity?.authenticated || !identity.login || building) return;
    setBuilding(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identity.login }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not verify this build history.');
      setResult(payload);
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : 'Could not verify this build history.');
    } finally {
      setBuilding(false);
    }
  }

  async function disconnectGitHub() {
    await fetch('/api/github/logout', { method: 'POST' });
    setIdentity({ authenticated: false });
    setResult(null);
  }

  async function checkPublicProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = checkUsername.trim().replace(/^@/, '');
    if (!username || checking) return;

    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not check this public GitHub profile.');
      setCheckResult(payload);
    } catch (checkError) {
      setCheckError(checkError instanceof Error ? checkError.message : 'Could not check this public GitHub profile.');
    } finally {
      setChecking(false);
    }
  }

  const noPublicCommits = result?.stats.commits365d === 0;
  const primaryHref = identity?.authenticated ? '#verify' : '/api/github/login?returnTo=/';

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main>
        <section className="hero-split" aria-labelledby="hero-title">
          <div className="hero-split__left">
            <span className="hero-split__tag">[ Monad Mainnet ]</span>
            <h1 id="hero-title" className="hero-split__title">Your commits,<br />verified onchain.</h1>
            <p className="hero-split__lede">
              A portfolio asks people to take your word for it. <strong>Admon reads your public GitHub history, binds the proof to your wallet, and makes it portable.</strong>
            </p>
            <div className="hero-split__stats" aria-label="Live protocol stats">
              <div className="stat">
                <span className="stat__n">{stats ? stats.totalMinted.toLocaleString() : '...'}</span>
                <span className="stat__l">Builders verified</span>
              </div>
              <div className="stat">
                <span className="stat__n">{stats ? stats.totalBuilt.toLocaleString() : '...'}</span>
                <span className="stat__l">Build records created</span>
              </div>
            </div>
            <div className="hero-cta-block">
              <div className="cta-cluster">
              <a className="btn-primary" href={primaryHref}>
                {identity?.authenticated ? 'Verify my build history ↓' : 'Connect GitHub to verify →'}
              </a>
              <a className="btn-ghost" href="#check">Check a GitHub username</a>
              </div>
              <span className="hero-note">GitHub OAuth · Public data only</span>
            </div>
            <MintTicker lastMint={stats?.lastMint ?? null} />
          </div>

          <div className="hero-split__right" aria-label="Example Admon build proof vehicle">
            <div className="car-stage">
              <div className="car-stage__label">
                <span>Verification vehicle / 001</span>
                <span>Each visual trait maps to real build data</span>
              </div>
              <div className="car-stage__vehicle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="car-stage__image" src={demoCar} alt="Example Admon vehicle in three-quarter view" />
              </div>
            </div>
          </div>
        </section>

        <section id="verify" className="verify-shell" aria-live="polite">
          <div className="verify-panel">
            <div className="verify-panel__copy">
              <span className="verify-panel__eyebrow">Step 01 / GitHub identity</span>
              {!identity ? (
                <p className="verify-panel__title">Checking your GitHub connection…</p>
              ) : identity.authenticated && identity.login ? (
                <p className="verify-panel__title">Ready to verify <em>@{identity.login}</em> against public GitHub activity.</p>
              ) : (
                <p className="verify-panel__title">Connect the GitHub account whose history you want to put onchain.</p>
              )}
              {error && <p className="verify-panel__error" role="alert">{error}</p>}
              {result && noPublicCommits && (
                <p className="verify-panel__error">
                  No public authored commits were found in the last 365 days, so there is no build proof to mint yet.
                </p>
              )}
            </div>

            {identity?.authenticated && identity.login ? (
              <div className="identity-chip">
                {identity.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={identity.avatarUrl} alt="" />
                )}
                <span>@{identity.login}</span>
                <button type="button" onClick={disconnectGitHub}>Disconnect</button>
                <button type="button" className="btn-primary" onClick={verifyBuild} disabled={building}>
                  {building ? 'Reading public activity…' : 'Verify my history →'}
                </button>
              </div>
            ) : (
              <a className="btn-primary" href="/api/github/login?returnTo=/">Connect GitHub →</a>
            )}
          </div>

          {result && !noPublicCommits && (
            <div className="verify-panel" style={{ borderTop: 0 }}>
              <div className="verify-panel__copy">
                <span className="verify-panel__eyebrow">Verified / {RARITY_LABELS[result.traits.rarity].label}</span>
                <p className="verify-panel__title">
                  {result.stats.commits365d.toLocaleString()} public commits, {result.stats.publicRepos} repositories, and a {result.stats.longestStreak}-day longest streak are ready to mint.
                </p>
              </div>
              <Link href={result.permalink} className="btn-primary">Inspect your proof →</Link>
            </div>
          )}

          <div id="check" className="verify-panel verify-panel--check" style={{ borderTop: 0 }}>
            <div className="verify-panel__copy">
              <span className="verify-panel__eyebrow">Public preview</span>
              <p className="verify-panel__title">Check any public GitHub username. Only that GitHub account can mint its record.</p>
              <p className="verify-panel__hint">No sign-in is needed to inspect public signals. A preview does not create a record or a mint authorization.</p>
              {checkError && <p className="verify-panel__error" role="alert">{checkError}</p>}
            </div>
            <form className="username-check" onSubmit={checkPublicProfile}>
              <label className="sr-only" htmlFor="github-username">GitHub username</label>
              <span aria-hidden="true">@</span>
              <input
                id="github-username"
                value={checkUsername}
                onChange={(event) => setCheckUsername(event.target.value)}
                placeholder="github-username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                maxLength={39}
              />
              <button className="btn-ghost" type="submit" disabled={checking}>{checking ? 'Checking...' : 'Check profile'}</button>
            </form>
          </div>

          {checkResult && checkedCar && (
            <section className="public-preview" aria-label={`Public build preview for ${checkResult.username}`}>
              <div className="public-preview__header">
                <div>
                  <span className="verify-panel__eyebrow">Public build preview</span>
                  <p className="verify-panel__title">@{checkResult.username}{checkResult.name ? ` · ${checkResult.name}` : ''}</p>
                </div>
                <span className="public-preview__score">Build score {checkResult.rarityScore.toLocaleString()}</span>
              </div>
              <div className="public-preview__body">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={checkedCar} alt={`Generated Admon vehicle preview for ${checkResult.username}`} />
                <div className="public-preview__stats">
                  <span><strong>{checkResult.stats.commits365d.toLocaleString()}</strong> commits / 365d</span>
                  <span><strong>{checkResult.stats.publicRepos}</strong> public repos</span>
                  <span><strong>{checkResult.stats.longestStreak}d</strong> longest streak</span>
                  <span><strong>{checkResult.traits.rarity}</strong> rarity</span>
                </div>
              </div>
              <div className="public-preview__footer">
                <p>This is a public preview only. To mint it, connect the GitHub account <strong>@{checkResult.username}</strong> and your wallet.</p>
                <div className="public-preview__actions">
                  <Link className="btn-ghost" href={`/preview/${encodeURIComponent(checkResult.username)}`}>Open preview page</Link>
                  <a className="btn-primary" href={`/api/github/login?returnTo=/?check=${encodeURIComponent(checkResult.username)}`}>Connect GitHub to mint →</a>
                </div>
              </div>
            </section>
          )}
        </section>

        <section className="proof-section" aria-labelledby="proof-title">
          <div className="proof-section__header">
            <div>
              <span className="section-kicker">The proof, not the flex</span>
              <h2 id="proof-title" className="section-title">A record a grant committee can actually check.</h2>
            </div>
            <p>
              Admon turns the signals already present in public GitHub activity into a wallet-owned record. The car is the visual signature; the trait data and transaction are the evidence.
            </p>
          </div>
          <div className="proof-grid">
            <article className="proof-card">
              <span className="proof-card__mark">01 / IDENTITY</span>
              <h3>GitHub OAuth confirms the profile</h3>
              <p>Only the connected GitHub account can ask Admon to prepare its proof for minting.</p>
            </article>
            <article className="proof-card">
              <span className="proof-card__mark">02 / SIGNAL</span>
              <h3>A build score rewards real output</h3>
              <p>All-time public commits lead the score, supported by current activity, streaks, repository breadth, stars, and account history.</p>
            </article>
            <article className="proof-card">
              <span className="proof-card__mark">03 / OWNERSHIP</span>
              <h3>Monad binds proof to a wallet</h3>
              <p>A short-lived, server-signed authorization makes the mint specific to your connected wallet.</p>
            </article>
          </div>
        </section>

        <LiveStats stats={stats} />
      </main>
      <Footer />
    </div>
  );
}

function MintTicker({
  lastMint,
}: {
  lastMint: LiveStats['lastMint'];
}) {
  if (!lastMint) {
    return (
      <div className="mint-ticker" role="status">
        <span className="mint-ticker__label">Mint feed</span>
        <span className="mint-ticker__empty">Waiting for the first verified mint</span>
      </div>
    );
  }

  return (
    <Link href={`/garage/${encodeURIComponent(lastMint.username)}`} className="mint-ticker" aria-label={`View the latest mint by ${lastMint.username}`}>
      <span className="mint-ticker__label">Latest mint</span>
      <span className="mint-ticker__username">@{lastMint.username}</span>
      <span className="mint-ticker__token">{lastMint.tokenId ? `Token #${lastMint.tokenId}` : 'Mint confirmed'}</span>
      <span className="mint-ticker__link">View proof</span>
    </Link>
  );
}

function LiveStats({ stats }: { stats: LiveStats | null }) {
  if (!stats) {
    return <section className="live-stats"><p className="live-stats__empty">Loading public verification totals…</p></section>;
  }

  const explorerV1 = stats.explorerV1 || stats.explorer || null;
  const explorerV2 = stats.explorerV2 || null;

  return (
    <section className="live-stats" aria-label="Admon protocol totals">
      <div className="live-stats__inner">
        <Link href="/garage" className="live-stats__stat">
          <span className="live-stats__n">{stats.totalBuilt.toLocaleString()}</span>
          <span className="live-stats__l">Build records</span>
        </Link>
        <Link href="/garage" className="live-stats__stat">
          <span className="live-stats__n">{stats.onChainMinted.toLocaleString()}</span>
          <span className="live-stats__l">Minted on Monad</span>
        </Link>
        {explorerV1 ? (
          <a href={explorerV1} target="_blank" rel="noreferrer" className="live-stats__stat">
            <span className="live-stats__n live-stats__n--sm">Contract V1 ↗</span>
            <span className="live-stats__l">Genesis · Monad Mainnet</span>
          </a>
        ) : (
          <span className="live-stats__stat">
            <span className="live-stats__n live-stats__n--sm">V1 deploying</span>
            <span className="live-stats__l">Genesis contract</span>
          </span>
        )}
        {explorerV2 ? (
          <a href={explorerV2} target="_blank" rel="noreferrer" className="live-stats__stat">
            <span className="live-stats__n live-stats__n--sm">Contract V2 ↗</span>
            <span className="live-stats__l">Trace · Monad Mainnet</span>
          </a>
        ) : (
          <span className="live-stats__stat">
            <span className="live-stats__n live-stats__n--sm">V2 deploying</span>
            <span className="live-stats__l">Trace contract</span>
          </span>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer-minimal">
      <span className="footer-minimal__brand">
        <svg className="footer-minimal__logo" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 14.5h18" />
          <path d="M5.5 14V10.5L10 7h5.5l3 3v4" />
          <circle cx="8" cy="15.5" r="1.75" />
          <circle cx="17" cy="15.5" r="1.75" />
        </svg>
        <span className="footer-minimal__mark">Admon.</span>
      </span>
      <div className="footer-minimal__links">
        <a href="https://github.com/mojeebdev/admon" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://docs.monad.xyz" target="_blank" rel="noreferrer">Monad docs</a>
        <a href="https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63" target="_blank" rel="noreferrer">Contract V1</a>
        <a href="https://monadscan.com/address/0xCc3fc8b272bca9de775ba7399E3dD7fd7a0173b0" target="_blank" rel="noreferrer">Contract V2</a>
        <Link href="/garage">Garage</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </div>
      <span className="footer-minimal__copy monad-badge">Built on Monad Mainnet</span>
    </footer>
  );
}
