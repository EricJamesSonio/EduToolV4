// src/commons/utils/debounce.util.ts
//
// Phase 2 (realtime safety): small reusable debounce/throttle helpers.
// Used for server-side coalescing of high-frequency socket broadcasts
// (e.g. groupy:read:updated trailing 3s) — never copy-paste timers.

/** Trailing-edge debounce for plain functions. */
export function debounceTrailing<T extends unknown[]>(
  fn: (...args: T) => void,
  waitMs: number,
): ((...args: T) => void) & { cancel: () => void } {
  let timer: NodeJS.Timeout | undefined;
  const debounced = (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, waitMs);
    timer.unref?.();
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}

/**
 * Leading + trailing throttle keyed by an arbitrary string.
 * First call per key executes immediately; calls inside the window collapse
 * into ONE trailing execution with the latest closure. Used so read receipts
 * stay live (leading) without fanning out per keystroke/scroll (trailing).
 */
export class KeyedTrailingThrottle {
  private readonly lastExec = new Map<string, number>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly pending = new Map<string, () => void>();

  constructor(private readonly windowMs: number) {}

  call(key: string, fn: () => void): void {
    const now = Date.now();
    const last = this.lastExec.get(key);
    if (last === undefined || now - last >= this.windowMs) {
      this.lastExec.set(key, now);
      fn();
      return;
    }

    // Inside the window: remember only the latest call.
    this.pending.set(key, fn);
    if (!this.timers.has(key)) {
      const timer = setTimeout(() => {
        this.timers.delete(key);
        const run = this.pending.get(key);
        this.pending.delete(key);
        this.lastExec.set(key, Date.now());
        run?.();
      }, this.windowMs - (now - last));
      // A deferred "seen by" ping must never hold the process open.
      timer.unref?.();
      this.timers.set(key, timer);
    }
  }

  cancel(key?: string): void {
    if (key === undefined) {
      for (const timer of this.timers.values()) clearTimeout(timer);
      this.timers.clear();
      this.pending.clear();
      return;
    }
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
    this.pending.delete(key);
  }
}
