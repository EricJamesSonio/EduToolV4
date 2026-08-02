import type { NextConfig } from "next";
const isDev = process.env.NODE_ENV === "development";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:5000";
const nextConfig: NextConfig = {
  output: "standalone",
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

              // ✅ FIXED (Docker + Dev + Prod ready)
              isDev
                ? `connect-src 'self' ${apiUrl} ${wsUrl} ${wsUrl.replace(/^http/, "ws")} ws://backend:3000 https://*.agora.io wss://*.agora.io`
                : "connect-src 'self' https://your-production-domain.com https://*.agora.io wss://*.agora.io",

              // Media
              "media-src 'self' blob:",

              // Images
              isDev
                ? `img-src 'self' data: blob: ${apiUrl} http://backend:3000`
                : "img-src 'self' data: blob:",

              "font-src 'self'",
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