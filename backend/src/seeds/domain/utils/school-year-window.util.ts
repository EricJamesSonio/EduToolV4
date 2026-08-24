/**
 * school-year-window.util.ts
 *
 * Generates a shared future school-year window for seeding.
 * Guarantees:
 *  - start_date is at least 10 days in the future (enrollment window)
 *  - random offset 10..40 days so not every seed looks identical
 *  - duration 10..12 months (300..365 days) per user request (10 months minimum)
 *  - dates are normalized to 00:00:00 local time to match service validation
 */

import { randInt } from './random.util';

export interface SchoolYearWindow {
  start: Date;
  end: Date;
  name: string;
}

function atMidnight(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, days: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return atMidnight(c);
}

/**
 * Generate a single shared window for the current seed run.
 * Uses Math.random via randInt; all orgs share the same window when
 * the caller caches the result (orchestrator does this).
 */
export function generateFutureSchoolYearWindow(): SchoolYearWindow {
  const now = atMidnight(new Date());
  // Shared: 10..40 days into the future gives enrollment time
  const offsetDays = randInt(10, 40);
  const start = addDays(now, offsetDays);
  // 10 months ~ 300 days, 12 months = 365 days (random)
  const durationDays = randInt(300, 365);
  const end = addDays(start, durationDays);

  const name = `SY ${start.getFullYear()}-${end.getFullYear()}`;

  return { start, end, name };
}

// Single shared instance for the lifetime of the seed process (import side-effect)
let cachedWindow: SchoolYearWindow | null = null;

export function getSharedSchoolYearWindow(): SchoolYearWindow {
  if (!cachedWindow) cachedWindow = generateFutureSchoolYearWindow();
  return cachedWindow;
}
