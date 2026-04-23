import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact — Neurocomputers',
  description: 'Get in touch about NeuroBridge.',
};

export default function ContactPage() {
  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <article className="max-w-2xl mx-auto">
        <nav className="mb-6 text-[12px]">
          <Link href="/" className="text-cyan-400 hover:underline">← Home</Link>
        </nav>
        <h1 className="text-[24px] font-display mb-1">Contact</h1>
        <p className="text-[13px] mt-4" style={{ color: 'var(--text-muted)' }}>
          NeuroBridge is built by Nikita Britikov, an independent researcher working on
          biocomputing and organoid intelligence tools.
        </p>

        <section className="mt-8 space-y-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <h2 className="text-[16px] font-display" style={{ color: 'var(--text-primary)' }}>Bugs &amp; feature requests</h2>
          <p>
            Open an issue on GitHub:{' '}
            <a href="https://github.com/Luckyguybiz/neurobridge/issues" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">
              github.com/Luckyguybiz/neurobridge/issues
            </a>
            .
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Collaborations, data access, research partnerships</h2>
          <p>
            Email:{' '}
            <a href="mailto:luckymakerbiz@gmail.com" className="text-cyan-400 hover:underline">
              luckymakerbiz@gmail.com
            </a>
          </p>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>Social</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              X (Twitter):{' '}
              <a href="https://x.com/nikitabritikov" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">@nikitabritikov</a>
            </li>
            <li>
              LinkedIn:{' '}
              <a href="https://www.linkedin.com/in/nik-britikov-3b6b79350/" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">Nik Britikov</a>
            </li>
            <li>
              GitHub:{' '}
              <a href="https://github.com/Luckyguybiz" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">@Luckyguybiz</a>
            </li>
          </ul>

          <h2 className="text-[16px] font-display mt-6" style={{ color: 'var(--text-primary)' }}>API questions</h2>
          <p>
            Interactive API reference:{' '}
            <a href="https://api.neurocomputers.io/docs" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">
              api.neurocomputers.io/docs
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
