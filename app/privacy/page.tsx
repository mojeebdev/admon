import Link from 'next/link';
import { Navbar } from '@/app/components/nav/Navbar';

export const metadata = {
  title: 'Privacy | Admon',
  description: 'How Admon uses public GitHub activity to create a protected build record.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="legal-page">
        <p className="section-kicker">Privacy</p>
        <h1>Public proof, limited data.</h1>
        <p className="legal-page__lede">Admon helps builders prove public work without asking for private work. We use only the public GitHub signals needed to create a build record.</p>
        <section>
          <h2>What Admon reads</h2>
          <p>Anyone can check a public GitHub username without signing in. For a public preview, Admon reads that profile&apos;s public repositories, public commit activity, stars, languages, account age, and contribution timing. After you sign in with GitHub, Admon also confirms your GitHub identity. It records your connected wallet address and mint transaction only when you mint.</p>
        </section>
        <section>
          <h2>What Admon does not read</h2>
          <p>Admon does not request access to private repositories, private source code, GitHub write permissions, or your wallet private key. GitHub OAuth uses the read-only <code>read:user</code> scope.</p>
        </section>
        <section>
          <h2>Why GitHub sign-in is required</h2>
          <p>Checking a username creates a public preview only. It does not create a database record, mint authorization, or NFT. GitHub OAuth is required to mint because it confirms that the person requesting the record controls that exact GitHub account. This protects builders before the record is bound to a wallet.</p>
        </section>
        <section>
          <h2>Cookies</h2>
          <p>Admon uses two strictly necessary, HTTP-only cookies only during GitHub OAuth: <code>admon_github_oauth_state</code> protects the sign-in flow for up to 10 minutes, and <code>admon_github_session</code> keeps your signed-in GitHub identity for up to 7 days. They are not used for advertising, cross-site tracking, or profiling. You can clear the session by disconnecting GitHub or clearing browser cookies.</p>
        </section>
        <section>
          <h2>Public records</h2>
          <p>Once minted, the build record, its traits, wallet address, transaction, and NFT metadata are public by design. The Garage and Monad are public systems, so do not mint information you do not want to be publicly associated with your wallet.</p>
        </section>
        <p className="legal-page__back"><Link href="/">Back to Admon</Link></p>
      </main>
    </div>
  );
}
