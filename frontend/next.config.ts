import type { NextConfig } from "next";
const isDev = process.env.NODE_ENV === "development";
// Baked at build time. Default to "" (fail-closed) — never assume localhost in
// the deployed bundle. Render/docker-compose must pass the real backend URL.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "";
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
// Backend origin behind the same-origin /api proxy. Used with
// NEXT_PUBLIC_API_URL=/api so the refresh cookie is first-party.
const proxyTarget = (process.env.API_PROXY_TARGET ?? "").replace(/\/+$/, "");

// Relative values such as "/api" are not valid CSP sources ('self' covers them).
const cspSources = (...values: string[]) =>
  Array.from(new Set(values.filter((v) => /^(https?|wss?):\/\//.test(v)))).join(" ");

const connectSources = cspSources(
  apiUrl,
  proxyTarget,
  wsUrl,
  wsUrl.replace(/^http/, "ws"),
  socketUrl,
  socketUrl.replace(/^http/, "ws"),
);
const imageSources = cspSources(apiUrl, proxyTarget);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    proxyTimeout: 120000,
  },
  async rewrites() {
    return [
      ...(proxyTarget
        ? [{ source: "/api/:path*", destination: `${proxyTarget}/:path*` }]
        : []),
      // Registrars browse /registrar/* while the pages still live under /admin.
      { source: "/registrar/school-profile", destination: "/admin/data-seeder" },
      { source: "/registrar/:path*", destination: "/admin/:path*" },
    ];
  },
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

              // Dev + Docker + Production ready — allow the configured API/WS hosts
              `connect-src 'self' ${connectSources} https://*.agora.io wss://*.agora.io`,

              // Media
              "media-src 'self' blob:",

              // Images
              `img-src 'self' data: blob: ${imageSources}`,

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