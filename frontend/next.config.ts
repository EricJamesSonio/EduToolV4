import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy',
value: [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.agora.io wss://*.agora.io ws://localhost:* wss://localhost:*",  // remove bare ws: wss:
  "media-src 'self' blob:",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "object-src 'none'",       // 👈 fixes "No Fallback" alert
  "base-uri 'self'",         // 👈 fixes "No Fallback" alert
].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;