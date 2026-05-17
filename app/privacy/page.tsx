import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Neurocomputers',
  description: 'How Neurocomputers handles data and user privacy.',
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen px-4 py-16 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: 'var(--bio-primary-500)', opacity: 'var(--ambient-blob-opacity)' }}
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
          Privacy Policy
        </h1>
        <p className="type-caption" style={{ marginTop: 'var(--space-1)', color: 'var(--text-tertiary)' }}>
          Last updated: April 2026
        </p>

        <section
          className="mt-8 space-y-5 type-body-large"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          <p>
            NeuroBridge (neurocomputers.io) is an open-source scientific tool. We try to collect as little as
            possible and never sell or share what we do have.
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>What we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Uploaded datasets</strong> — spike data files you upload are held in memory on the API server and auto-evicted after the dataset cap is reached (currently 2 concurrent datasets). Datasets are never persisted to disk beyond the upload tmp file, which is deleted on parse failure.</li>
            <li><strong>Server logs</strong> — request timestamps, endpoints, response codes, and your IP for rate-limiting. Retained 14 days in PM2 log rotation.</li>
            <li><strong>No cookies</strong> beyond a local-storage theme preference.</li>
            <li><strong>No third-party trackers, no advertising IDs, no Google Analytics.</strong></li>
          </ul>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>What we don&apos;t collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Personal information (name, email, phone) — there is no account system.</li>
            <li>Browsing history outside of this site.</li>
            <li>Payment information — this is a free research tool.</li>
          </ul>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Open source</h2>
          <p>
            All code is public at{' '}
            <a
              href="https://github.com/Luckyguybiz/neurobridge"
              target="_blank"
              rel="noopener"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              github.com/Luckyguybiz/neurobridge
            </a>{' '}
            and{' '}
            <a
              href="https://github.com/Luckyguybiz/neurobridge-api"
              target="_blank"
              rel="noopener"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              github.com/Luckyguybiz/neurobridge-api
            </a>
            . You can audit the data-handling logic directly.
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Contact</h2>
          <p>
            Questions? See{' '}
            <Link
              href="/contact"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              /contact
            </Link>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
