import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/app/components/nav/Navbar';
import { ConnectionControl } from '@/app/components/builder/ConnectionControl';
import { ConnectionInbox } from '@/app/components/builder/ConnectionInbox';
import { WeeklyMintButton } from '@/app/components/builder/WeeklyMintButton';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { findBuilderByUsername } from '@/app/lib/builders';
import { prisma } from '@/app/lib/prisma';
import type { CarTraits } from '@/app/lib/traits';
import { weeklyContractAddress } from '@/app/lib/monad';

type BuilderPageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: BuilderPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | Builder | Admon`,
    description: `Historical Admon build records for @${username}.`,
  };
}

export const revalidate = 60;

export default async function BuilderProfilePage({ params }: BuilderPageProps) {
  const { username } = await params;
  const builder = await findBuilderByUsername(username);
  const legacyCars = await prisma.car.findMany({
    where: builder
      ? { builderId: builder.id }
      : { githubUsername: { equals: username, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  });
  const records = builder
    ? await prisma.buildRecord.findMany({ where: { builderId: builder.id }, orderBy: { weekKey: 'desc' } })
    : [];
  const identity = builder || legacyCars[0];

  if (!identity) notFound();

  const githubUsername = builder?.githubUsername || legacyCars[0].githubUsername;
  const name = builder?.name || legacyCars[0]?.name;
  const genesisNumber = builder?.genesisNumber || legacyCars.find((car) => car.genesisNumber)?.genesisNumber;

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="builder-page">
        <header className="builder-page__header">
          <div>
            <p className="section-kicker">Builder ledger / Monad Mainnet</p>
            <h1>@{githubUsername}</h1>
            {name && <p className="builder-page__name">{name}</p>}
          </div>
          <div className="builder-page__badges">
            {genesisNumber && <span className="builder-badge builder-badge--genesis">Genesis #{genesisNumber}</span>}
            <a className="builder-badge" href={`https://github.com/${encodeURIComponent(githubUsername)}`} target="_blank" rel="noreferrer">GitHub profile</a>
          </div>
        </header>

        <section className="builder-ledger" aria-labelledby="records-title">
          <div className="builder-ledger__header">
            <div>
              <span className="verify-panel__eyebrow">Build history</span>
              <h2 id="records-title">Every car, dated and kept.</h2>
            </div>
            <p>{legacyCars.length + records.length} build record{legacyCars.length + records.length === 1 ? '' : 's'}</p>
          </div>

          <div className="builder-records">
            {legacyCars.map((car) => (
              <LegacyRecordCard key={car.id} car={car} />
            ))}
            {records.map((record) => (
              <article className="builder-record" key={record.id}>
                <div className="builder-record__meta">
                  <span>Weekly record</span>
                  <span>{record.weekKey}</span>
                </div>
                <p className="builder-record__title">{record.rarityTier} build record</p>
                <p className="builder-record__copy">{record.totalCommits.toLocaleString()} total commits · Build score {record.rarityScore.toLocaleString()}</p>
                <span className={record.mintedAt ? 'builder-record__status builder-record__status--minted' : 'builder-record__status'}>
                  {record.mintedAt ? `Minted · token #${record.tokenId}` : 'Ready on Friday'}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="builder-page__connection">
          <span className="verify-panel__eyebrow">Builder connections</span>
          <h2>Collaboration over consistency.</h2>
          <p>Verified builders can send a connection request. The other builder chooses whether to accept it. Messaging will only be considered after both people agree to connect.</p>
          <div className="builder-page__connection-action"><ConnectionControl username={githubUsername} /></div>
          <ConnectionInbox profileUsername={githubUsername} />
        </section>

        <section className="builder-page__weekly">
          <span className="verify-panel__eyebrow">Weekly record</span>
          <h2>Refresh your proof every Friday.</h2>
          <p>Admon Trace creates one fresh, wallet-bound build record for the authenticated GitHub owner each Friday UTC. Your prior cars stay in this ledger.</p>
          <div className="builder-page__connection-action"><WeeklyMintButton username={githubUsername} contractAddress={weeklyContractAddress()} /></div>
        </section>
      </main>
    </div>
  );
}

function LegacyRecordCard({ car }: { car: { id: string; githubUsername: string; traits: unknown; rarityTier: string; totalCommits: number; rarityScore: number; createdAt: Date; mintedAt: Date | null; tokenId: number | null; genesisNumber: number | null } }) {
  const image = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderCarSVG(car.traits as CarTraits, {
    username: car.githubUsername,
    width: 960,
    height: 540,
    showRarityBadge: true,
    background: 'transparent',
  }));

  return (
    <article className="builder-record builder-record--car">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={`Admon vehicle for ${car.githubUsername}`} />
      <div className="builder-record__meta">
        <span>{car.genesisNumber ? `Genesis #${car.genesisNumber}` : 'V1 build record'}</span>
        <span>{car.createdAt.toISOString().slice(0, 10)}</span>
      </div>
      <p className="builder-record__title">{car.rarityTier} build record</p>
      <p className="builder-record__copy">{car.totalCommits.toLocaleString()} total commits · Build score {car.rarityScore.toLocaleString()}</p>
      <div className="builder-record__actions">
        <Link href={`/garage/${encodeURIComponent(car.githubUsername)}`}>View proof</Link>
        <span className={car.mintedAt ? 'builder-record__status builder-record__status--minted' : 'builder-record__status'}>
          {car.mintedAt ? `Minted · token #${car.tokenId}` : 'Unminted'}
        </span>
      </div>
    </article>
  );
}
