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
        <p className="legal-page__lede">Admon exists to help builders prove public work without asking for private work. We read only the public GitHub signals needed to create a build record.</p>
        <section>
          <h2>What Admon reads</h2>
          <p>After you sign in with GitHub, Admon confirms your GitHub identity and reads your public profile, public repositories, public commit activity, stars, languages, account age, and contribution timing. It also records your connected wallet address and mint transaction only when you mint.</p>
        </section>
        <section>
          <h2>What Admon does not read</h2>
          <p>Admon does not request access to private repositories, private source code, GitHub write permissions, or your wallet private key. GitHub OAuth uses the read-only <code>read:user</code> scope.</p>
        </section>
        <section>
          <h2>Why GitHub sign-in is required</h2>
          <p>A username form would let a bad actor mint another builder’s public work. GitHub OAuth confirms that the person requesting a build record controls that GitHub account. This protects builders before the record is bound to a wallet.</p>
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
