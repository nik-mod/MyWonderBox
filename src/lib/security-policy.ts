export function contentSecurityPolicy(nonce?: string) {
  const development = process.env.NODE_ENV === 'development';
  // Static storefront pages need Next.js's inline hydration scripts. Admin pages use a fresh nonce.
  const scripts = nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src 'self' ${scripts} 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    `connect-src 'self' blob:${development ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');
}
