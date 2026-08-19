// backend/test/utils/net.util.ts
//
// Probes whether the database referenced by a connection string is actually
// reachable, so e2e specs can skip cleanly (with a clear log line) instead
// of failing noisily with connection-refused errors when no DB is running
// locally/in CI.

import { execFileSync } from 'child_process';

export function isDatabaseReachable(
  connectionString: string | undefined,
  timeoutMs = 3000,
): boolean {
  if (!connectionString) return false;

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return false;
  }

  const host = url.hostname;
  const port = Number(url.port || 5432); // 5432: Postgres default, matches this project's DB
  const candidates =
    host === 'localhost' ? ['127.0.0.1', '::1', 'localhost'] : [host];

  const script = [
    'const net = require("net");',
    `const port = ${port};`,
    `const candidates = ${JSON.stringify(candidates)};`,
    `const deadline = setTimeout(() => process.exit(1), ${timeoutMs + 1000});`,
    'let i = 0;',
    'function attempt() {',
    '  if (i >= candidates.length) { clearTimeout(deadline); process.exit(1); }',
    '  const host = candidates[i++];',
    `  const s = net.connect({ host, port, timeout: ${timeoutMs} });`,
    "  s.on('connect', () => { s.destroy(); clearTimeout(deadline); process.exit(0); });",
    "  s.on('error', () => { try { s.destroy(); } catch (_) {} attempt(); });",
    "  s.on('timeout', () => { try { s.destroy(); } catch (_) {} attempt(); });",
    '}',
    'attempt();',
  ].join('\n');

  try {
    // execFileSync spawns node directly (no shell), so no quote-escaping
    // issues on Windows.
    execFileSync(process.execPath, ['-e', script], {
      stdio: 'ignore',
      timeout: timeoutMs + 3000,
    });
    return true;
  } catch {
    return false;
  }
}
