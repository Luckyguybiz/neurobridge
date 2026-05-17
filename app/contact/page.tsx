import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact — Neurocomputers',
  description: 'Get in touch about NeuroBridge.',
};

export default function ContactPage() {
  return (
    <div
      className="min-h-screen px-4 py-16 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/4 w-[600px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: 'var(--bio-spark-600)', opacity: 'var(--ambient-blob-opacity)' }}
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
        <div className="type-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Get in touch</div>
        <h1
          className="font-display"
          style={{ fontSize: 'var(--t-3xl)', fontWeight: 400, letterSpacing: '-0.022em', lineHeight: 1.1, color: 'var(--text-primary)' }}
        >
          Contact
        </h1>
        <p
          className="type-body-large"
          style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}
        >
          NeuroBridge is built by Nikita Britikov, an independent researcher working on
          biocomputing and organoid intelligence tools.
        </p>

        <section
          className="mt-10 space-y-5 type-body-large"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          <h2 className="type-title-2">Bugs &amp; feature requests</h2>
          <p>
            Open an issue on GitHub:{' '}
            <a
              href="https://github.com/Luckyguybiz/neurobridge/issues"
              target="_blank"
              rel="noopener"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              github.com/Luckyguybiz/neurobridge/issues
            </a>
            .
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Collaborations, data access, research partnerships</h2>
          <p>
            Email:{' '}
            <a
              href="mailto:luckymakerbiz@gmail.com"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              luckymakerbiz@gmail.com
            </a>
          </p>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>Social</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              X (Twitter):{' '}
              <a
                href="https://x.com/nikitabritikov"
                target="_blank"
                rel="noopener"
                className="motion-fast"
                style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
              >
                @nikitabritikov
              </a>
            </li>
            <li>
              LinkedIn:{' '}
              <a
                href="https://www.linkedin.com/in/nik-britikov-3b6b79350/"
                target="_blank"
                rel="noopener"
                className="motion-fast"
                style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
              >
                Nik Britikov
              </a>
            </li>
            <li>
              GitHub:{' '}
              <a
                href="https://github.com/Luckyguybiz"
                target="_blank"
                rel="noopener"
                className="motion-fast"
                style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
              >
                @Luckyguybiz
              </a>
            </li>
          </ul>

          <h2 className="type-title-2" style={{ marginTop: 'var(--space-8)' }}>API questions</h2>
          <p>
            Interactive API reference:{' '}
            <a
              href="https://api.neurocomputers.io/docs"
              target="_blank"
              rel="noopener"
              className="motion-fast"
              style={{ color: 'var(--bio-primary-500)', fontWeight: 'var(--tw-semibold)' }}
            >
              api.neurocomputers.io/docs
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
