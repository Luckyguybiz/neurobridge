import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use — Neurocomputers',
  description: 'Terms of use for the NeuroBridge scientific tool.',
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <article className="max-w-2xl mx-auto">
        <nav className="mb-6 text-[12px]">
          <Link href="/" className="text-cyan-400 hover:underline">← Home</Link>
        </nav>
        <h1 className="text-[24px] font-display mb-1">Terms of Use</h1>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Last updated: April 2026</p>

        <section className="mt-8 space-y-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <h2 className="text-[16px] font-display mt-2" style={{ color: 'var(--text-primary)' }}>Research use</h2>
          <p>
            NeuroBridge is a free open-source research tool. It is provided as-is for academic and
            scientific exploration of multi-electrode array (MEA) data from brain organoids and similar
            biological neural networks. The code is MIT-licensed.
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>No warranties</h2>
          <p>
            The analyses are not certified for clinical use or any diagnostic decision. Metric definitions
            (NCI Score, Complexity, Temporal Prediction, etc.) are heuristic research composites, not
            validated biomarkers. Do not use output as the sole basis for any decision.
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Fair use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Rate limits: 60 req/min regular, 5 req/min heavy analysis. Automated bulk querying beyond these limits may be throttled.</li>
            <li>Upload limit: 100 MB per file. Larger datasets should be downsampled locally first.</li>
            <li>The hosted service runs on a single VPS; it is not SLA-backed. For production pipelines, self-host from the GitHub repos.</li>
          </ul>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Data you upload</h2>
          <p>
            Uploaded datasets stay in server RAM only, and are evicted when the 2-dataset cap is reached.
            They are not persisted, shared, or used for training anything. See{' '}
            <Link href="/privacy" className="text-cyan-400 hover:underline">/privacy</Link> for details.
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Citation</h2>
          <p>
            If you publish results derived from NeuroBridge, a citation to the tool and the underlying
            methods papers (linked from each analysis card) is appreciated but not required.
          </p>
        </section>
      </article>
    </div>
  );
}
