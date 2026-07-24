import type { Metadata } from 'next';
import { Navbar } from '@/app/components/nav/Navbar';
import { PreviewLookup } from '@/app/components/car/PreviewLookup';

export const metadata: Metadata = {
  title: 'Preview a builder | Admon',
  description: 'Inspect the public GitHub build signals behind an Admon Trace vehicle.',
};

export default function PreviewLookupPage() {
  return (
    <div className="bg-dot-grid">
      <Navbar />
      <main className="preview-lookup">
        <span className="section-kicker">Public build preview</span>
        <h1>Inspect the trail<br />before the mint.</h1>
        <p>Enter any public GitHub username to generate its Admon Trace Meridian preview. Only the authenticated owner of that GitHub account can mint a record.</p>
        <PreviewLookup />
      </main>
    </div>
  );
}
