'use client';
import Link from 'next/link';

export function Brand({ large = false, onHomeNavigate }: { large?: boolean; onHomeNavigate?: () => void }) {
  return (
    <Link href="/" prefetch={false} className={`brand brand-lockup ${large ? 'brand-large' : ''}`} aria-label="MyWonderBox — მთავარი"
      onNavigate={event => {
        onHomeNavigate?.();
        if (window.location.pathname !== '/') return;

        event.preventDefault();
        if (window.location.search || window.location.hash) window.history.replaceState(null, '', '/');
        // ScrollTrigger can refresh the hero while a smooth scroll is in flight.
        window.scrollTo({ top: 0, behavior: 'instant' });
      }}>
      <img src="/brand/mywonderbox/logo.webp" alt="" width={720} height={480} decoding="async"
        srcSet="/brand/mywonderbox/logo-compact.webp 288w, /brand/mywonderbox/logo.webp 720w"
        sizes={large ? '192px' : '(max-width: 850px) 105px, 120px'} />
    </Link>
  );
}

export function BoxMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="18" y="36" width="64" height="48" rx="12" fill="#FFC322" stroke="currentColor" strokeWidth="4" />
      <path d="M50 36C39 35 28 27 32 18c5-9 16 0 18 18Zm0 0c11-1 22-9 18-18-5-9-16 0-18 18Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="38" cy="55" r="3.5" fill="currentColor" /><circle cx="62" cy="55" r="3.5" fill="currentColor" />
      <path d="M42 66c4 6 12 6 16 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
