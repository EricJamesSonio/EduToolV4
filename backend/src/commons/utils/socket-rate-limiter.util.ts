// src/commons/utils/socket-rate-limiter.util.ts
//
// Phase 2 (realtime safety): generic per-key token-bucket rate limiter for
// Socket.IO gateways. Shared by meeting.gateway.ts and groupy.gateway.ts —
// never copy-paste bucket logic per gateway.
//
// Usage:
//   private readonly rateLimiter = new SocketRateLimiter();
//   if (!this.rateLimiter.checkLimit(client.id, 'chat', { capacity: 2, refillMs: 2_000 })) {
//     client.emit('rate_limited', { event: 'chat' });
//     return;
//   }
// Call `clearSocket(client.id)` on disconnect so dead sockets don't pin memory.

export interface SocketRateLimitOptions {
  /** Max burst before throttling kicks in. */
  capacity: number;
  /** Window in ms over which `capacity` tokens refill (continuous refill). */
  refillMs: number;
}

/** Generous reconnect ceiling shared by all gateways (reconnect-storm guard). */
export const SOCKET_CONNECT_LIMIT: SocketRateLimitOptions = {
  capacity: 10,
  refillMs: 60_000,
};

interface Bucket {
  tokens: number;
  lastRefill: number;
}

// Hard cap so a connect storm can't grow the map without bound.
const MAX_BUCKETS = 20_000;

export class SocketRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  /**
   * Returns true when the caller may proceed (one token consumed),
   * false when throttled (caller should drop + notify the socket).
   */
  checkLimit(
    socketId: string,
    bucketKey: string,
    options: SocketRateLimitOptions,
  ): boolean {
    const key = `${socketId}:${bucketKey}`;
    const now = Date.now();

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: options.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    } else if (now > bucket.lastRefill) {
      bucket.tokens = Math.min(
        options.capacity,
        bucket.tokens +
          ((now - bucket.lastRefill) * options.capacity) / options.refillMs,
      );
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    if (this.buckets.size > MAX_BUCKETS) {
      // Evict the stalest-inserted bucket; Map preserves insertion order.
      const oldest = this.buckets.keys().next();
      if (!oldest.done) this.buckets.delete(oldest.value);
    }
    return false;
  }

  /** Drop all buckets for a disconnected socket. */
  clearSocket(socketId: string): void {
    const prefix = `${socketId}:`;
    for (const key of this.buckets.keys()) {
      if (key.startsWith(prefix)) this.buckets.delete(key);
    }
  }
}
