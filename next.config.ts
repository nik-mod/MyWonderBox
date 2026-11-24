import type { NextConfig } from 'next';
import { packagingDesigns } from './src/lib/packaging';
import { contentSecurityPolicy } from './src/lib/security-policy';
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  async redirects() {
    return Object.values(packagingDesigns).map(({ storedSlug, slug }) => ({
      source: `/shop/${storedSlug}`, destination: `/shop/${slug}`, permanent: true,
    }));
  },
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ...(process.env.NODE_ENV === 'production'
          ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
          : []),
      ] },
      ...['/admin/:path*', '/order/:token', '/api/orders/:token'].map(source => ({ source, headers: [
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Cache-Control', value: 'private, no-store' },
      ] })),
    ];
  },
};
export default config;
