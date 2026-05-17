import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Bio ambient blobs */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'var(--bio-primary-500)', opacity: 'var(--ambient-blob-opacity)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'var(--bio-neural-500)', opacity: 'var(--ambient-blob-opacity)' }}
      />

      <div className="text-center max-w-md relative z-10 anim-spring-in">
        <div
          className="font-display tabular text-hero-gradient"
          style={{
            fontSize: 'clamp(5rem, 14vw, 8rem)',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          404
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: 'var(--t-2xl)',
            fontWeight: 'var(--tw-semibold)',
            lineHeight: 1.15,
            letterSpacing: '-0.022em',
            marginTop: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)',
          }}
        >
          Page not found
        </h1>
        <p
          className="type-body-large"
          style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}
        >
          The page you&apos;re looking for doesn&apos;t exist. Try one of these:
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/"
            className="motion-spring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '40px',
              padding: '0 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bio-primary-500)',
              color: '#0a0c14',
              fontSize: 'var(--t-sm)',
              fontWeight: 'var(--tw-semibold)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.18), 0 6px 16px color-mix(in srgb, var(--bio-primary-500) 32%, transparent)',
            }}
          >
            ← Home
          </Link>
          <Link
            href="/dashboard"
            className="motion-spring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--glass-thin)',
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              color: 'var(--text-primary)',
              fontSize: 'var(--t-sm)',
              fontWeight: 'var(--tw-semibold)',
              boxShadow:
                'inset 0 1px 0 var(--edge-top), inset 0 -1px 0 var(--edge-bottom), 0 0 0 1px var(--edge-outline)',
            }}
          >
            Open dashboard
          </Link>
          <a
            href="https://api.neurocomputers.io/docs"
            target="_blank"
            rel="noopener"
            className="motion-spring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 'var(--t-sm)',
              fontWeight: 'var(--tw-medium)',
              boxShadow: 'inset 0 0 0 1px var(--edge-outline)',
            }}
          >
            API docs
          </a>
        </div>
      </div>
    </div>
  );
}
