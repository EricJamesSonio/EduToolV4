// backend/test/utils/id.util.ts
//
// Centralizes generation of test-only identifiers (uuids, slugs, emails).
//
// Root cause this file works around: the `uuid` package's type declarations
// aren't resolving in this project (missing/misaligned `@types/uuid`, or a
// moduleResolution gap), so `v4()` comes back typed as `any`. That makes
// *every* call site that does `uuid()` or `uuid().slice(...)` trip
// `@typescript-eslint/no-unsafe-call` / `no-unsafe-member-access`.
//
// The real fix is aligning `@types/uuid` with the installed `uuid` version
// (or switching to `crypto.randomUUID()`, which ships its own types). Until
// that's done, this module isolates the single untyped call behind one
// explicit type assertion, so the rest of the codebase — including every
// e2e spec — gets a fully-typed, warning-free API instead of re-triggering
// the same unsafe-call warning at each usage.

import { v4 } from 'uuid';

// Single narrow assertion: documents that `v4()` returns a string (which it
// does at runtime) without spreading `any` into every call site.
const uuidV4 = v4 as () => string;

/** Full random UUID v4 string. */
export function genId(): string {
  return uuidV4();
}

/** Short id fragment (default 8 chars) — e.g. for slugs or de-duped emails. */
export function genShortId(length = 8): string {
  return genId().slice(0, length);
}

/** Test entity id with a readable prefix, e.g. `genPrefixedId('org')` -> `org-<uuid>`. */
export function genPrefixedId(prefix: string): string {
  return `${prefix}-${genId()}`;
}

/** Slug-safe identifier, e.g. `genSlug('e2e9a')` -> `e2e9a-<8 chars>`. */
export function genSlug(prefix: string, length = 8): string {
  return `${prefix}-${genShortId(length)}`;
}

/**
 * Unique test email. `localPrefix` should already contain any
 * caller-specific context (tags, truncated org ids, etc).
 * e.g. `genEmail('edu-abc123')` -> `edu-abc123-f3a1@example.com`.
 */
export function genEmail(localPrefix: string, domain = 'example.com'): string {
  return `${localPrefix}-${genShortId(4)}@${domain}`;
}
