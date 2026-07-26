import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/app/components/nav/Navbar';
import { prisma } from '@/app/lib/prisma';

export const metadata: Metadata = {
  title: 'Builders | Admon',
  description: 'Verified builders with public Admon build records on Monad.',
};

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function BuildersPage() {
  const [builders, unlinkedCars] = await Promise.all([
    prisma.builder.findMany({
      include: {
        legacyCars: { orderBy: { createdAt: 'desc' }, take: 1 },
        records: { orderBy: { weekKey: 'desc' }, take: 1 },
        _count: { select: { legacyCars: true, records: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 120,
    }),
    prisma.car.findMany({
      where: { builderId: null },
      orderBy: [{ rarityScore: 'desc' }, { totalCommits: 'desc' }],
      take: 120,
    }),
  ]);

  const entries = [
    ...builders.map((builder) => {
      const legacy = builder.legacyCars[0];
      const record = builder.records[0];
      return {
        username: builder.githubUsername,
        name: builder.name,
        avatarUrl: builder.avatarUrl,
        genesisNumber: builder.genesisNumber ?? legacy?.genesisNumber ?? null,
        totalCommits: record?.totalCommits ?? legacy?.totalCommits ?? 0,
        rarityScore: record?.rarityScore ?? legacy?.rarityScore ?? 0,
        recordCount: builder._count.legacyCars + builder._count.records,
      };
    }),
    ...unlinkedCars.map((car) => ({
      username: car.githubUsername,
      name: car.name,
      avatarUrl: car.avatarUrl,
      genesisNumber: car.genesisNumber,
      totalCommits: car.totalCommits,
      rarityScore: car.rarityScore,
      recordCount: 1,
    })),
  ].sort((a, b) => b.rarityScore - a.rarityScore || b.totalCommits - a.totalCommits);

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="builder-directory">
        <header className="builder-directory__header">
          <span className="section-kicker">Admon builder directory</span>
          <h1>Follow the public<br />trail of builders.</h1>
          <p>Every entry is an Admon record created from public GitHub activity. Open a profile to inspect its cars, onchain proof, and available builder actions.</p>
          <span className="builder-directory__count">{entries.length} verified builder{entries.length === 1 ? '' : 's'}</span>
        </header>

        {entries.length ? (
          <section className="builder-directory__grid" aria-label="Verified builders">
            {entries.map((builder, index) => (
              <Link key={builder.username.toLowerCase()} href={`/builder/${encodeURIComponent(builder.username)}`} className="builder-directory__card">
                <span className="builder-directory__rank">{String(index + 1).padStart(2, '0')}</span>
                {builder.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={builder.avatarUrl} alt="" className="builder-directory__avatar" />
                ) : <span className="builder-directory__avatar builder-directory__avatar--fallback">@</span>}
                <div>
                  <strong>@{builder.username}</strong>
                  {builder.name && <span>{builder.name}</span>}
                </div>
                <div className="builder-directory__signals">
                  <span><small>Build score</small>{builder.rarityScore.toLocaleString()}</span>
                  <span><small>Commits</small>{builder.totalCommits.toLocaleString()}</span>
                </div>
                <footer>
                  <span>{builder.genesisNumber ? `Genesis #${builder.genesisNumber}` : `${builder.recordCount} build record${builder.recordCount === 1 ? '' : 's'}`}</span>
                  <span>Open profile →</span>
                </footer>
              </Link>
            ))}
          </section>
        ) : <div className="builder-directory__empty">No builder records yet. Verify a public GitHub history to become the first.</div>}
      </main>
    </div>
  );
}
