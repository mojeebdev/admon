import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/app/lib/prisma';
import { Navbar } from '@/app/components/nav/Navbar';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { RARITY_LABELS, type CarTraits, type RarityTier } from '@/app/lib/traits';
import { getTotalMinted } from '@/app/lib/contract';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Garage | Admon',
  description: 'A public Garage of GitHub-verified build records minted on Monad.',
};

const TIERS: Array<RarityTier | 'all'> = ['all', 'mythic', 'legendary', 'epic', 'rare', 'common'];

export default async function GaragePage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const where = tier && tier !== 'all' ? { rarityTier: tier } : {};
  const [cars, totalCount, mintedCount] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy: [{ rarityScore: 'desc' }, { totalCommits: 'desc' }, { createdAt: 'desc' }],
      take: 120,
    }),
    prisma.car.count(),
    getTotalMinted(),
  ]);

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="hall">
        <header className="hall__header">
          <div className="hall__eyebrow">/ public proof garage</div>
          <h1 className="hall__title">Every verified build.<br />One public record.</h1>
          <p className="hall__sub">
            Ranked by Build Score: public commits, current activity, consistency, repositories, stars, and account history. {totalCount.toLocaleString()} build records created and {mintedCount.toLocaleString()} bound to wallets on Monad Mainnet.
          </p>
          <nav className="hall__filters" aria-label="Filter build records by rarity">
            {TIERS.map((value) => {
              const active = (tier ?? 'all') === value;
              const href = value === 'all' ? '/garage' : `/garage?tier=${value}`;
              return (
                <Link key={value} href={href} className={`hall__filter ${active ? 'active' : ''}`}>
                  {value}
                </Link>
              );
            })}
          </nav>
        </header>

        {cars.length === 0 ? (
          <div className="hall__empty">
            There are no verification records in this tier yet. <Link href="/" style={{ color: 'var(--accent)' }}>Verify yours.</Link>
          </div>
        ) : (
          <div className="hall__grid">
            {cars.map((car: (typeof cars)[number], index: number) => {
              const traits = car.traits as unknown as CarTraits;
              const rarity = RARITY_LABELS[traits.rarity];
              const svg = renderCarSVG(traits, {
                username: car.githubUsername,
                width: 540,
                height: 304,
                showRarityBadge: false,
              });
              const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
              return (
                <Link key={car.id} href={`/builder/${car.githubUsername}`} className="hall__card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUri} alt={`Admon vehicle for ${car.githubUsername}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <div className="hall__card__meta">
                    <span className="hall__card__username">#{index + 1} @{car.githubUsername}</span>
                    <span className="hall__card__rarity" style={{ color: rarity.color, background: `${rarity.color}1f` }}>
                      {rarity.label}{car.mintedAt ? ' · minted' : ''}
                    </span>
                  </div>
                  {car.genesisNumber && <span className="hall__card__genesis">Genesis #{car.genesisNumber}</span>}
                  <span className="hall__card__commits">{car.totalCommits.toLocaleString()} public commits</span>
                </Link>
              );
            })}
          </div>
        )}
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
        <div className="footer-minimal__links">
          <Link href="/">Verify your history</Link>
          <a href="https://github.com/mojeebdev/admon" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://docs.monad.xyz" target="_blank" rel="noreferrer">Monad docs</a>
          <a href="https://monadscan.com/address/0xb6aedBF17a11928A63773F88a9CfD3E252F43a63" target="_blank" rel="noreferrer">Contract V1</a>
          <a href="https://monadscan.com/address/0xCc3fc8b272bca9de775ba7399E3dD7fd7a0173b0" target="_blank" rel="noreferrer">Contract V2</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <span className="footer-minimal__copy">Built on Monad Mainnet</span>
      </footer>
    </div>
  );
}
