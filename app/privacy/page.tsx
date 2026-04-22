import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Neurocomputers',
  description: 'How Neurocomputers handles data and user privacy.',
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <article className="max-w-2xl mx-auto prose-sm">
        <nav className="mb-6 text-[12px]">
          <Link href="/" className="text-cyan-400 hover:underline">← Home</Link>
        </nav>
        <h1 className="text-[24px] font-display mb-1">Privacy Policy</h1>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Last updated: April 2026</p>

        <section className="mt-8 space-y-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <p>
            NeuroBridge (neurocomputers.io) is an open-source scientific tool. We try to collect as little as
            possible and never sell or share what we do have.
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>What we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Uploaded datasets</strong> — spike data files you upload are held in memory on the API server and auto-evicted after the dataset cap is reached (currently 2 concurrent datasets). Datasets are never persisted to disk beyond the upload tmp file, which is deleted on parse failure.</li>
            <li><strong>Server logs</strong> — request timestamps, endpoints, response codes, and your IP for rate-limiting. Retained 14 days in PM2 log rotation.</li>
            <li><strong>No cookies</strong> beyond a local-storage theme preference.</li>
            <li><strong>No third-party trackers, no advertising IDs, no Google Analytics.</strong></li>
          </ul>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>What we don&apos;t collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Personal information (name, email, phone) — there is no account system.</li>
            <li>Browsing history outside of this site.</li>
            <li>Payment information — this is a free research tool.</li>
          </ul>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Open source</h2>
          <p>
            All code is public at{' '}
            <a href="https://github.com/Luckyguybiz/neurobridge" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">github.com/Luckyguybiz/neurobridge</a>{' '}
            and{' '}
            <a href="https://github.com/Luckyguybiz/neurobridge-api" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">github.com/Luckyguybiz/neurobridge-api</a>.
            You can audit the data-handling logic directly.
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Contact</h2>
          <p>
            Questions? See <Link href="/contact" className="text-cyan-400 hover:underline">/contact</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
