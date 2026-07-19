import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/app/lib/prisma';
import { Navbar } from '@/app/components/nav/Navbar';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';
import { MintButton } from '@/app/components/car/MintButton';
import { appUrl, contractAddress, MONAD_EXPLORER_URL, openSeaAssetUrl } from '@/app/lib/monad';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) return { title: 'Admon - record not found' };

  const traits = car.traits as unknown as CarTraits;
  const rarity = RARITY_LABELS[traits.rarity];
  const title = `@${car.githubUsername}'s ${rarity.label} build proof | Admon`;
  const description = `Verified public GitHub build history for @${car.githubUsername}, ready to inspect on Monad.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/${car.githubUsername}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/${car.githubUsername}`],
    },
  };
}

export default async function ProofPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) notFound();

  const traits = car.traits as unknown as CarTraits;
  const stats = car.statsSnapshot as unknown as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const svg = renderCarSVG(traits, {
    username: car.githubUsername,
    width: 960,
    height: 540,
    background: 'void',
  });
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const recordUrl = `${appUrl()}/garage/${encodeURIComponent(car.githubUsername)}`;
  const shareText = `My public GitHub build history is verified onchain with Admon: @${car.githubUsername}`;
  const launchPostUrl = process.env.NEXT_PUBLIC_LAUNCH_POST_URL?.trim();
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(launchPostUrl ? `${shareText}\n\nMy proof: ${recordUrl}` : shareText)}&url=${encodeURIComponent(launchPostUrl || recordUrl)}`;
  const contract = contractAddress();
  const openSeaUrl = car.mintedAt && car.tokenId != null && contract
    ? openSeaAssetUrl(contract, car.tokenId)
    : null;

  prisma.car.update({
    where: { id: car.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="car-page">
        <article className="car-page__card">
          <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 25 }}>
            <div>
              <p className="hall__eyebrow">Admon build proof / Monad Mainnet</p>
              <h1 style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontSize: 'clamp(35px, 5vw, 54px)', letterSpacing: '-.045em', lineHeight: 1, color: 'var(--ink-primary)' }}>
                @{car.githubUsername}
              </h1>
              {car.name && <p style={{ marginTop: 7, color: 'var(--ink-secondary)', fontSize: 14 }}>{car.name}</p>}
            </div>
            <span className="hall__card__rarity" style={{ color: rarity.color, background: `${rarity.color}1f`, padding: '8px 11px' }}>
              {rarity.label}{car.mintedAt ? ' · minted' : ' · verified'}
            </span>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUri}
            alt={`Admon vehicle created from ${car.githubUsername}'s public GitHub build history`}
            style={{ display: 'block', width: '100%', height: 'auto', border: '1px solid var(--void-05)' }}
          />

          <div className="car-page__stats">
            <div><p className="car-page__stat__label">Commits / 365d</p><p className="car-page__stat__value">{stats.commits365d.toLocaleString()}</p></div>
            <div><p className="car-page__stat__label">Public repos</p><p className="car-page__stat__value">{stats.publicRepos}</p></div>
            <div><p className="car-page__stat__label">Longest streak</p><p className="car-page__stat__value">{stats.longestStreak}d</p></div>
            <div><p className="car-page__stat__label">Total stars</p><p className="car-page__stat__value">{stats.totalStars.toLocaleString()}</p></div>
            <div><p className="car-page__stat__label">Top language</p><p className="car-page__stat__value">{stats.topLanguage}</p></div>
            <div><p className="car-page__stat__label">Peak commit hour</p><p className="car-page__stat__value">{stats.peakCommitHour}:00</p></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginTop: 27 }}>
            <MintButton username={car.githubUsername} traits={traits} alreadyMinted={!!car.mintedAt} tokenId={car.tokenId} contractAddress={contract} />
            <a href={`/api/og/${encodeURIComponent(car.githubUsername)}`} download={`admon-${car.githubUsername}.png`} className="btn-ghost">
              Download share card
            </a>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-ghost">Share on X</a>
            {openSeaUrl && <a href={openSeaUrl} target="_blank" rel="noreferrer" className="btn-ghost">View on OpenSea</a>}
            <Link href="/garage" className="btn-ghost">Back to Garage</Link>
          </div>

          {car.mintTxHash && (
            <p style={{ marginTop: 18, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-accent)', fontSize: 10 }}>
              Monad transaction:{' '}
              <a href={`${MONAD_EXPLORER_URL}/tx/${car.mintTxHash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                {car.mintTxHash.slice(0, 10)}…{car.mintTxHash.slice(-6)}
              </a>
              {contract && <> · <a href={`${MONAD_EXPLORER_URL}/token/${contract}?a=${car.tokenId}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>View token</a></>}
            </p>
          )}
        </article>
      </main>
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
        <div className="footer-minimal__links"><Link href="/">Verify a build history</Link><a href="https://github.com/mojeebdev/admon" target="_blank" rel="noreferrer">GitHub</a><a href="https://docs.monad.xyz" target="_blank" rel="noreferrer">Monad docs</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        <span className="footer-minimal__copy">Built on Monad Mainnet</span>
      </footer>
    </div>
  );
}
