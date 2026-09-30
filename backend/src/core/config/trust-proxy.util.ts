// src/core/config/trust-proxy.util.ts
//
// Resolves the Express `trust proxy` setting from the TRUST_PROXY env var.
//
// WHY THIS EXISTS: the global ThrottlerGuard keys its counters on `req.ip`.
// Behind a reverse proxy every request would otherwise report the PROXY's IP,
// so every user in the world would share a single rate-limit bucket (a login
// limit of 10/min would lock out an entire school at once).
//
// SECURITY — the hop count MUST match the real proxy chain:
//   - Too LOW  -> `req.ip` stays the proxy's IP -> all users share a bucket.
//   - Too HIGH -> `req.ip` is read from a client-controllable position in
//     X-Forwarded-For -> a client can spoof it and evade limits entirely.
//
// NOTE: the production value is NOT verified for Render. Confirm it after
// deploy with the TRUST_PROXY_DEBUG probe in main.ts before relying on it.

export type TrustProxySetting = number | boolean | string;

/**
 * Resolve Express's `trust proxy` value.
 *
 * Accepted forms:
 *   - unset/empty  -> `1` in production, `false` elsewhere (local dev must not
 *                     trust a spoofable X-Forwarded-For header).
 *   - /^\d+$/      -> hop count (Number).
 *   - "true"/"false" (case-insensitive) -> boolean.
 *   - anything else -> passed through as a string. Express accepts a
 *     comma-separated IP/subnet list, e.g. "10.0.0.1,192.168.0.0/16".
 */
export function resolveTrustProxy(
  raw: string | undefined,
  nodeEnv: string,
): TrustProxySetting {
  if (raw === undefined || raw.trim() === '') {
    return nodeEnv === 'production' ? 1 : false;
  }

  const value = raw.trim();

  if (/^\d+$/.test(value)) return Number(value);

  const lowered = value.toLowerCase();
  if (lowered === 'true') return true;
  if (lowered === 'false') return false;

  return value;
}
