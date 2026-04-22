import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="text-center max-w-md">
        <div className="text-[56px] font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent tabular-nums">
          404
        </div>
        <h1 className="text-[20px] font-display mt-2 mb-3" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          The page you&apos;re looking for doesn&apos;t exist. Maybe you meant one of these:
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-[12px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all"
          >
            ← Home
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-[12px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Open dashboard
          </Link>
          <a
            href="https://api.neurocomputers.io/docs"
            target="_blank"
            rel="noopener"
            className="px-4 py-2 rounded-lg text-[12px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            API docs
          </a>
        </div>
      </div>
    </div>
  );
}
