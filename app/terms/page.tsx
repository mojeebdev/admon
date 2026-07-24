import Link from 'next/link';
import { Navbar } from '@/app/components/nav/Navbar';

export const metadata = {
  title: 'Terms | Admon',
  description: 'Terms for using Admon build verification and Monad NFT minting.',
};

export default function TermsPage() {
  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="legal-page">
        <p className="section-kicker">Terms</p>
        <h1>Build records belong to the builders behind them.</h1>
        <p className="legal-page__lede">Admon creates an onchain record from public GitHub activity. By using it, you confirm that you are verifying your own GitHub account and understand the public nature of blockchain records.</p>
        <section>
          <h2>Eligibility and acceptable use</h2>
          <p>Anyone may inspect a public GitHub username, but only the person who completes GitHub OAuth for that exact account may create and mint its build record. Do not attempt to bypass identity checks, misrepresent public activity, or use Admon to impersonate another builder.</p>
        </section>
        <section>
          <h2>Minting</h2>
          <p>Minting is an onchain action on Monad Mainnet. You are responsible for your wallet, MON gas fees, and reviewing the transaction in your wallet. Admon does not custody funds or private keys.</p>
        </section>
        <section>
          <h2>Builder connections</h2>
          <p>Connection requests are opt-in. Do not use them to harass, spam, impersonate, or collect another builder&apos;s personal information. Admon may limit or remove connection access to protect builders and the service.</p>
        </section>
        <section>
          <h2>No guarantee of achievement</h2>
          <p>Build Scores and vehicle traits summarize public GitHub signals. They are not an employment credential, financial product, ranking of personal worth, or guarantee of any outcome.</p>
        </section>
        <section>
          <h2>Availability</h2>
          <p>Admon depends on GitHub, Supabase, Monad, OpenSea, and wallet providers. Their availability and policies may affect the service. The verified Admon contract is published under the MIT License.</p>
        </section>
        <p className="legal-page__back"><Link href="/">Back to Admon</Link></p>
      </main>
    </div>
  );
}
