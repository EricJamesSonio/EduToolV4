/**
 * random.util.ts
 *
 * Small randomization primitives shared by every seeder that needs to pick
 * a random level/section/educator or shuffle candidates for even
 * distribution.
 */

/** Pick a random item from an array */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a random integer between min and max (inclusive) */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Randomly shuffle an array (in place) using the seed's randInt. */
export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
