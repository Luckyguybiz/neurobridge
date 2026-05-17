import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use — Neurocomputers',
  description: 'Terms of use for the NeuroBridge scientific tool.',
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen px-4 py-16 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 right-1/4 w-[600px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: 'var(--bio-neural-500)', opacity: 'var(--ambient-blob-opacity)' }}
      />

      <article className="max-w-2xl mx-auto relative z-10">
        <nav className="mb-6">
          <Link
            href="/"
            className="motion-fast"
            style={{ fontSize: 'var(--t-sm)', color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
          >
            ← Home
          </Link>
        </nav>
        <div className="type-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Legal</div>
        <h1
          className="font-display"
          style={{ fontSize: 'var(--t-3xl)', fontWeight: 400, letterSpacing: '-0.022em', lineHeight: 1.1, color: 'var(--text-primary)' }}
        >
          Terms of Use
        </h1>
        <p className="type-caption" style={{ marginTop: 'var(--space-1)', color: 'var(--text-tertiary)' }}>
          Last updated: April 2026
        </p>

        <section
          className="mt-8 space-y-5 type-body-large"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          <h2 className="type-title-2" style={{ marginTop: 'var(--space-4)' }}>Research use</h2>
          <p>
            NeuroBridge is a free open-source research tool. It is provided as-is for academic and
            scientific exploration of multi-electrode array (MEA) data from brain organoids and similar
            biological neural networks. The code is MIT-licensed.
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>No warranties</h2>
          <p>
            The analyses are not certified for clinical use or any diagnostic decision. Metric definitions
            (NCI Score, Complexity, Temporal Prediction, etc.) are heuristic research composites, not
            validated biomarkers. Do not use output as the sole basis for any decision.
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Fair use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Rate limits: 60 req/min regular, 5 req/min heavy analysis. Automated bulk querying beyond these limits may be throttled.</li>
            <li>Upload limit: 100 MB per file. Larger datasets should be downsampled locally first.</li>
            <li>The hosted service runs on a single VPS; it is not SLA-backed. For production pipelines, self-host from the GitHub repos.</li>
          </ul>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Data you upload</h2>
          <p>
            Uploaded datasets stay in server RAM only, and are evicted when the 2-dataset cap is reached.
            They are not persisted, shared, or used for training anything. See{' '}
            <Link
              href="/privacy"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              /privacy
            </Link>{' '}
            for details.
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Citation</h2>
          <p>
            If you publish results derived from NeuroBridge, a citation to the tool and the underlying
            methods papers (linked from each analysis card) is appreciated but not required.
          </p>
        </section>
      </article>
    </div>
  );
}
