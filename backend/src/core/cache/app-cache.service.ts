// src/core/cache/app-cache.service.ts
//
// Shared read-through cache for rarely-changing, org-scoped reference data
// (Perf Phase 6). Backed by cache-manager's in-memory store — no Redis needed,
// single-instance semantics. Keys are ALWAYS org-scoped (or global-literal)
// so tenants can never read each other's entries.
//
// Upgrade path (needs infra decision, see TICK-INFRA-007 handoff): swap the
// store in app-cache.module.ts for a Redis Keyv store behind REDIS_URL.
// The get-or-set + prefix-invalidation API below stays unchanged.
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export const APP_CACHE_TTL = {
  orgSettings: 30 * 60 * 1000,
  referenceData: 10 * 60 * 1000,
  gradingScale: 5 * 60 * 1000,
} as const;

@Injectable()
export class AppCacheService {
  // Registry of keys written through this service so delByPrefix works on
  // stores without native prefix scans (memory store). Bounded: entries are
  // removed when their key is deleted.
  private readonly keys = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  key(...parts: Array<string | number>): string {
    return parts.map((p) => String(p)).join(':');
  }

  async cached<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const hit = await this.cache.get<T>(key);
    if (hit !== undefined && hit !== null) return hit;
    const value = await loader();
    // Never cache nullish reads: a missing row must be re-read (it may be
    // created next request), and caching null would mask creation.
    if (value === undefined || value === null) return value;
    await this.cache.set(key, value, ttlMs);
    this.keys.add(key);
    return value;
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
    this.keys.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const matched = [...this.keys].filter((k) => k.startsWith(prefix));
    await Promise.all(matched.map((k) => this.cache.del(k)));
    for (const k of matched) this.keys.delete(k);
  }
}
