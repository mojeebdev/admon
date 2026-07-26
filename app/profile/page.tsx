import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/app/components/nav/Navbar';
import { ConnectionInbox } from '@/app/components/builder/ConnectionInbox';
import { ConversationsPanel } from '@/app/components/builder/ConversationsPanel';
import { WeeklyMintButton } from '@/app/components/builder/WeeklyMintButton';
import { ensureBuilderForUsername } from '@/app/lib/builders';
import { readGitHubSessionValue } from '@/app/lib/githubAuth';
import { weeklyContractAddress } from '@/app/lib/monad';
import { prisma } from '@/app/lib/prisma';

export const metadata: Metadata = {
  title: 'My profile | Admon',
  description: 'Private Admon builder profile, connections, conversations, and weekly build records.',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const session = readGitHubSessionValue(cookieStore.get('admon_github_session')?.value);
  if (!session) redirect('/api/github/login?returnTo=/profile');

  const builder = await ensureBuilderForUsername(session.login);
  if (!builder) redirect('/?profile=verify');

  const [legacyCars, records] = await Promise.all([
    prisma.car.findMany({ where: { builderId: builder.id }, orderBy: { createdAt: 'desc' } }),
    prisma.buildRecord.findMany({ where: { builderId: builder.id }, orderBy: { weekKey: 'desc' } }),
  ]);
  const totalRecords = legacyCars.length + records.length;

  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="profile-page">
        <header className="profile-page__header">
          <div>
            <span className="section-kicker">Private builder profile</span>
            <h1>@{builder.githubUsername}</h1>
            <p>This is your private Admon workspace. Your public proof stays on your builder page.</p>
          </div>
          <Link className="btn-ghost" href={`/builder/${encodeURIComponent(builder.githubUsername)}`}>View public profile</Link>
        </header>

        <section className="profile-page__summary" aria-label="Your Admon records">
          <span><small>Build records</small><strong>{totalRecords}</strong></span>
          <span><small>Genesis status</small><strong>{builder.genesisNumber ? `#${builder.genesisNumber}` : 'Not Genesis'}</strong></span>
          <span><small>Latest record</small><strong>{records[0]?.weekKey || legacyCars[0]?.createdAt.toISOString().slice(0, 10) || 'None'}</strong></span>
        </section>

        <section className="profile-page__section profile-page__section--mint">
          <span className="verify-panel__eyebrow">Your Friday record</span>
          <h2>Refresh your proof every Friday.</h2>
          <p>Only you can request a signed Admon Trace mint for your authenticated GitHub username.</p>
          <WeeklyMintButton username={builder.githubUsername} contractAddress={weeklyContractAddress()} />
        </section>

        <section className="profile-page__section">
          <span className="verify-panel__eyebrow">Connection requests</span>
          <h2>Requests are private to you.</h2>
          <ConnectionInbox />
        </section>

        <section className="profile-page__section">
          <span className="verify-panel__eyebrow">Builder conversations</span>
          <h2>Talk after both builders agree.</h2>
          <ConversationsPanel />
        </section>
      </main>
    </div>
  );
}
