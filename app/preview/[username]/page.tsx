import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/app/components/nav/Navbar';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { InteractiveVehicle } from '@/app/components/car/InteractiveVehicle';
import { buildStatsSnapshot, normalizeUsername } from '@/app/lib/github';
import { computeRarityScore, computeTraits } from '@/app/lib/traits';

type PreviewPageProps = { params: Promise<{ username: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} preview | Admon`,
    description: `Public Admon build preview for @${username}.`,
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) notFound();

  let data: Awaited<ReturnType<typeof buildStatsSnapshot>>;
  try {
    data = await buildStatsSnapshot(username);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) notFound();
    throw error;
  }

  const traits = computeTraits(data.stats);
  const score = computeRarityScore(data.stats);
  const image = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderCarSVG(traits, {
    username: data.user.login,
    width: 960,
    height: 540,
    showRarityBadge: true,
    background: 'transparent',
  }));

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="preview-page">
        <header className="preview-page__header">
          <div>
            <p className="section-kicker">Public build preview</p>
            <h1>@{data.user.login}</h1>
            {data.user.name && <p>{data.user.name}</p>}
          </div>
          <span className="preview-page__stamp">Preview only</span>
        </header>

        <section className="preview-page__record">
          <div className="preview-page__vehicle">
            <InteractiveVehicle
              src={image}
              alt={`Generated Admon preview vehicle for ${data.user.login}`}
              details={[
                { label: 'Chassis', value: 'Trace Meridian' },
                { label: 'Paint', value: traits.paint },
                { label: 'Finish', value: traits.finish },
                { label: 'Aero', value: traits.aero },
                { label: 'Build score', value: score.toLocaleString() },
              ]}
            />
          </div>
          <div className="preview-page__signals">
            <span>Build score</span><strong>{score.toLocaleString()}</strong>
            <span>Commits / 365d</span><strong>{data.stats.commits365d.toLocaleString()}</strong>
            <span>Public repos</span><strong>{data.stats.publicRepos}</strong>
            <span>Longest streak</span><strong>{data.stats.longestStreak}d</strong>
            <span>Top language</span><strong>{data.stats.topLanguage}</strong>
            <span>Rarity</span><strong>{traits.rarity}</strong>
          </div>
        </section>

        <section className="preview-page__notice">
          <div>
            <span className="verify-panel__eyebrow">Builder protection</span>
            <h2>This preview cannot be minted by someone else.</h2>
            <p>Only the person who connects the exact GitHub account <strong>@{data.user.login}</strong> can create a mintable record, then bind it to their wallet.</p>
          </div>
          <div className="preview-page__actions">
            <a className="btn-primary" href="/api/github/login?returnTo=/">Connect GitHub to mint</a>
            <Link className="btn-ghost" href="/">Check another username</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
