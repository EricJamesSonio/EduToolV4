// Fake clock for lifecycle e2e tests.
// Only Date is replaced: timers, nextTick and I/O stay real, so the app, Prisma and
// supertest behave normally while the test can jump forward to the end of a school year.
export const e2eClock = {
  start(at: Date = new Date()): void {
    jest.useFakeTimers({
      now: at,
      advanceTimers: true,
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
  },

  set(to: Date): void {
    jest.setSystemTime(to);
  },

  now(): Date {
    return new Date();
  },

  stop(): void {
    jest.useRealTimers();
  },
};