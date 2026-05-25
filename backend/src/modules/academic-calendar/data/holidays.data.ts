// backend/src/modules/academic-calendar/data/holidays.data.ts
// Complete Philippine holiday seed list.
// Keys are stable identifiers used in OrgHolidayConfig.enabled_keys.
// month/day are 1-indexed. Movable holidays use approximate dates — admin adjusts per year.

export interface HolidaySeed {
  key:          string;
  title:        string;
  month:        number;  // 1–12
  day:          number;  // 1–31
  description?: string;
  isDefault:    boolean; // true = enabled out-of-the-box
  isMovable?:   boolean; // true = date changes yearly (Holy Week, Eid, etc.)
}

export const PHILIPPINE_HOLIDAYS: HolidaySeed[] = [

  // ── Regular National Holidays ──────────────────────────────────────────────

  {
    key:         'new_year',
    title:       "New Year's Day",
    month:       1,
    day:         1,
    description: 'January 1 — Regular holiday',
    isDefault:   true,
  },
  {
    key:         'araw_ng_kagitingan',
    title:       'Araw ng Kagitingan (Day of Valor)',
    month:       4,
    day:         9,
    description: 'April 9 — Commemorates the Fall of Bataan',
    isDefault:   true,
  },
  {
    key:         'labor_day',
    title:       'Labor Day',
    month:       5,
    day:         1,
    description: 'May 1 — International Labor Day',
    isDefault:   true,
  },
  {
    key:         'independence_day',
    title:       'Independence Day',
    month:       6,
    day:         12,
    description: 'June 12 — Philippine Independence Day',
    isDefault:   true,
  },
  {
    key:         'ninoy_aquino_day',
    title:       'Ninoy Aquino Day',
    month:       8,
    day:         21,
    description: 'August 21 — Benigno Aquino Jr. Day',
    isDefault:   true,
  },
  {
    key:         'national_heroes_day',
    title:       'National Heroes Day',
    month:       8,
    day:         25,
    description: 'Last Monday of August — date varies yearly',
    isDefault:   true,
    isMovable:   true,
  },
  {
    key:         'bonifacio_day',
    title:       'Bonifacio Day',
    month:       11,
    day:         30,
    description: 'November 30 — Andres Bonifacio Day',
    isDefault:   true,
  },
  {
    key:         'christmas_day',
    title:       'Christmas Day',
    month:       12,
    day:         25,
    description: 'December 25 — Christmas Day',
    isDefault:   true,
  },
  {
    key:         'rizal_day',
    title:       'Rizal Day',
    month:       12,
    day:         30,
    description: 'December 30 — Jose Rizal Day',
    isDefault:   true,
  },

  // ── Holy Week (movable) ────────────────────────────────────────────────────

  {
    key:         'maundy_thursday',
    title:       'Maundy Thursday',
    month:       4,
    day:         17,
    description: 'Holy Week — movable date, varies yearly',
    isDefault:   true,
    isMovable:   true,
  },
  {
    key:         'good_friday',
    title:       'Good Friday',
    month:       4,
    day:         18,
    description: 'Holy Week — movable date, varies yearly',
    isDefault:   true,
    isMovable:   true,
  },
  {
    key:         'black_saturday',
    title:       'Black Saturday',
    month:       4,
    day:         19,
    description: 'Holy Week — sometimes observed by schools, movable date',
    isDefault:   false,
    isMovable:   true,
  },

  // ── Muslim Holidays (movable, based on Islamic calendar) ──────────────────

  {
    key:         'eid_ul_fitr',
    title:       "Eid'l Fitr",
    month:       4,
    day:         10,
    description: 'Feast of Ramadan — movable date, varies yearly per Islamic calendar',
    isDefault:   false,
    isMovable:   true,
  },
  {
    key:         'eid_ul_adha',
    title:       "Eid'l Adha",
    month:       6,
    day:         17,
    description: 'Feast of Sacrifice — movable date, varies yearly per Islamic calendar',
    isDefault:   false,
    isMovable:   true,
  },

  // ── Special (Non-Working) Holidays ────────────────────────────────────────

  {
    key:         'chinese_new_year',
    title:       'Chinese New Year',
    month:       1,
    day:         29,
    description: 'Movable date — declared yearly if applicable',
    isDefault:   false,
    isMovable:   true,
  },
  {
    key:         'edsa_people_power',
    title:       'EDSA People Power Revolution Anniversary',
    month:       2,
    day:         25,
    description: 'February 25 — observance depends on administration/year',
    isDefault:   false,
  },
  {
    key:         'all_saints_day',
    title:       "All Saints' Day",
    month:       11,
    day:         1,
    description: 'November 1 — special non-working holiday',
    isDefault:   false,
  },
  {
    key:         'all_souls_day',
    title:       "All Souls' Day",
    month:       11,
    day:         2,
    description: 'November 2 — school discretion, sometimes no classes',
    isDefault:   false,
  },
  {
    key:         'immaculate_conception',
    title:       'Feast of the Immaculate Conception',
    month:       12,
    day:         8,
    description: 'December 8 — special holiday',
    isDefault:   false,
  },
  {
    key:         'christmas_eve',
    title:       'Christmas Eve',
    month:       12,
    day:         24,
    description: 'December 24 — special non-working holiday',
    isDefault:   false,
  },
  {
    key:         'new_year_eve',
    title:       "New Year's Eve",
    month:       12,
    day:         31,
    description: 'December 31 — last day of the year, special holiday',
    isDefault:   false,
  },
];

/** Returns all holidays with their enabled status for a given set of enabled keys */
export function resolveHolidays(
  enabledKeys: string[],
): (HolidaySeed & { enabled: boolean })[] {
  const keySet = new Set(enabledKeys);
  return PHILIPPINE_HOLIDAYS.map((h) => ({
    ...h,
    enabled: keySet.has(h.key),
  }));
}

/** Returns the default enabled keys (isDefault=true) */
export function getDefaultEnabledKeys(): string[] {
  return PHILIPPINE_HOLIDAYS.filter((h) => h.isDefault).map((h) => h.key);
}

/**
 * Given enabled keys + year, compute actual Date objects for each holiday.
 * Used when seeding into AcademicCalendar events.
 */
export function buildHolidayDates(
  enabledKeys: string[],
  year: number,
): Array<{ key: string; title: string; date: Date; description?: string }> {
  const keySet = new Set(enabledKeys);
  return PHILIPPINE_HOLIDAYS.filter((h) => keySet.has(h.key)).map((h) => ({
    key:         h.key,
    title:       h.title,
    description: h.description,
    date:        new Date(year, h.month - 1, h.day),
  }));
}