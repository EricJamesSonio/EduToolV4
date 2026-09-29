import {
  SOCKET_CONNECT_LIMIT,
  SocketRateLimiter,
} from '@/commons/utils/socket-rate-limiter.util';
import {
  debounceTrailing,
  KeyedTrailingThrottle,
} from '@/commons/utils/debounce.util';

describe('SocketRateLimiter (shared token bucket)', () => {
  it('allows burst up to capacity, then throttles', () => {
    const limiter = new SocketRateLimiter();
    const opts = { capacity: 2, refillMs: 60_000 };
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(false);
  });

  it('isolates buckets per socket and per event', () => {
    const limiter = new SocketRateLimiter();
    const opts = { capacity: 1, refillMs: 60_000 };
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(false);
    // Other client unaffected (burst from one client never starves others).
    expect(limiter.checkLimit('s-2', 'chat', opts)).toBe(true);
    // Other event on the same socket unaffected.
    expect(limiter.checkLimit('s-1', 'reaction', opts)).toBe(true);
  });

  it('refills after the window', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    try {
      const limiter = new SocketRateLimiter();
      const opts = { capacity: 1, refillMs: 1_000 };
      expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
      expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(false);
      jest.advanceTimersByTime(1_000);
      expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('clearSocket drops dead-socket buckets', () => {
    const limiter = new SocketRateLimiter();
    const opts = { capacity: 1, refillMs: 60_000 };
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
    limiter.clearSocket('s-1');
    expect(limiter.checkLimit('s-1', 'chat', opts)).toBe(true);
  });

  it('shared connect limit is a sane reconnect ceiling', () => {
    expect(SOCKET_CONNECT_LIMIT.capacity).toBeLessThanOrEqual(10);
    expect(SOCKET_CONNECT_LIMIT.refillMs).toBeGreaterThanOrEqual(60_000);
  });
});

describe('debounceTrailing', () => {
  it('coalesces rapid calls into one trailing execution', () => {
    jest.useFakeTimers();
    try {
      const fn = jest.fn();
      const debounced = debounceTrailing(fn, 3_000);
      debounced();
      debounced();
      debounced();
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3_000);
      expect(fn).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('KeyedTrailingThrottle', () => {
  it('executes leading immediately, coalesces trailing with latest args', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    try {
      const throttle = new KeyedTrailingThrottle(3_000);
      const fn = jest.fn();
      throttle.call('class-1:u-1', () => fn('msg-1'));
      expect(fn).toHaveBeenCalledTimes(1); // leading
      throttle.call('class-1:u-1', () => fn('msg-2'));
      throttle.call('class-1:u-1', () => fn('msg-3'));
      expect(fn).toHaveBeenCalledTimes(1); // suppressed inside window
      jest.advanceTimersByTime(3_000);
      expect(fn).toHaveBeenCalledTimes(2); // one trailing…
      expect(fn).toHaveBeenLastCalledWith('msg-3'); // …with the latest id
    } finally {
      jest.useRealTimers();
    }
  });

  it('isolates keys (one viewer never suppresses another)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    try {
      const throttle = new KeyedTrailingThrottle(3_000);
      const fn = jest.fn();
      throttle.call('class-1:u-1', () => fn('a'));
      throttle.call('class-1:u-2', () => fn('b'));
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
