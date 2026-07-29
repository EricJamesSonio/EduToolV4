import type { NextConfig } from "next";
const isDev = process.env.NODE_ENV === "development";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              // Styles
              "style-src 'self' 'unsafe-inline'",
              // ✅ FIXED: allow backend in dev
              isDev
                ? "connect-src 'self' http://localhost:5000 ws://localhost:* wss://localhost:* https://*.agora.io wss://*.agora.io"
                : "connect-src 'self' https://*.agora.io wss://*.agora.io",
              // Media (for video calls, blobs, etc.)
              "media-src 'self' blob:",
              // Images — allow backend origin in dev
              isDev
                ? "img-src 'self' data: blob: http://localhost:5000"
                : "img-src 'self' data: blob:",
              // Fonts
              "font-src 'self'",
              // Security hardening
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
export default nextConfig;