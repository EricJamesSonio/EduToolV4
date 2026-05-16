// backend/src/modules/academic-calendar/data/holidays.data.ts
// Hardcoded Philippine holiday seed list.
// Keys are stable identifiers used in OrgHolidayConfig.enabled_keys.
// month/day are 1-indexed. year=null means recurring annually.

export interface HolidaySeed {
  key:         string;
  title:       string;
  month:       number;  // 1–12
  day:         number;  // 1–31
  description?: string;
  isDefault:   boolean; // true = enabled out-of-the-box for new orgs
}

export const PHILIPPINE_HOLIDAYS: HolidaySeed[] = [
  {
    key:         'new_year',
    title:       "New Year's Day",
    month:       1,
    day:         1,
    description: 'National holiday',
    isDefault:   true,
  },
  {
    key:         'araw_ng_kagitingan',
    title:       'Araw ng Kagitingan',
    month:       4,
    day:         9,
    description: 'Day of Valor — commemorates the Fall of Bataan',
    isDefault:   true,
  },
  {
    key:         'labor_day',
    title:       'Labor Day',
    month:       5,
    day:         1,
    description: 'International Labor Day',
    isDefault:   true,
  },
  {
    key:         'independence_day',
    title:       'Independence Day',
    month:       6,
    day:         12,
    description: 'Philippine Independence Day',
    isDefault:   true,
  },
  {
    key:         'national_heroes_day',
    title:       'National Heroes Day',
    month:       8,
    day:         25,   // Last Monday of August — approximated to 25th; client can adjust
    description: 'Last Monday of August',
    isDefault:   true,
  },
  {
    key:         'bonifacio_day',
    title:       'Bonifacio Day',
    month:       11,
    day:         30,
    description: 'Andres Bonifacio Day',
    isDefault:   true,
  },
  {
    key:         'christmas_day',
    title:       'Christmas Day',
    month:       12,
    day:         25,
    description: 'Christmas Day',
    isDefault:   true,
  },
  {
    key:         'rizal_day',
    title:       'Rizal Day',
    month:       12,
    day:         30,
    description: 'Jose Rizal Day',
    isDefault:   true,
  },
  {
    key:         'new_year_eve',
    title:       "New Year's Eve",
    month:       12,
    day:         31,
    description: 'Last Day of the Year',
    isDefault:   false,
  },
  {
    key:         'all_saints_day',
    title:       "All Saints' Day",
    month:       11,
    day:         1,
    description: "All Saints' Day",
    isDefault:   false,
  },
  {
    key:         'all_souls_day',
    title:       "All Souls' Day",
    month:       11,
    day:         2,
    description: "All Souls' Day",
    isDefault:   false,
  },
  {
    key:         'immaculate_conception',
    title:       'Feast of the Immaculate Conception',
    month:       12,
    day:         8,
    description: 'Feast of the Immaculate Conception of Mary',
    isDefault:   false,
  },
  {
    key:         'holy_thursday',
    title:       'Holy Thursday',
    month:       4,
    day:         17,  // Approximate — varies by year; admin adjusts
    description: 'Maundy Thursday — Holy Week',
    isDefault:   false,
  },
  {
    key:         'good_friday',
    title:       'Good Friday',
    month:       4,
    day:         18,  // Approximate — varies by year; admin adjusts
    description: 'Good Friday — Holy Week',
    isDefault:   false,
  },
  {
    key:         'black_saturday',
    title:       'Black Saturday',
    month:       4,
    day:         19,
    description: 'Black Saturday — Holy Week',
    isDefault:   false,
  },
  {
    key:         'eid_ul_fitr',
    title:       "Eid'l Fitr",
    month:       4,
    day:         20,  // Approximate — varies; admin must set actual date per year
    description: "Feast of Ramadan — date varies annually",
    isDefault:   false,
  },
  {
    key:         'eid_ul_adha',
    title:       "Eid'l Adha",
    month:       6,
    day:         28,  // Approximate — varies; admin must set actual date per year
    description: 'Feast of Sacrifice — date varies annually',
    isDefault:   false,
  },
  {
    key:         'chinese_new_year',
    title:       'Chinese New Year',
    month:       1,
    day:         29,  // Approximate — varies; admin adjusts
    description: 'Chinese New Year — date varies annually',
    isDefault:   false,
  },
  {
    key:         'ninoy_aquino_day',
    title:       'Ninoy Aquino Day',
    month:       8,
    day:         21,
    description: 'Benigno Aquino Jr. Day',
    isDefault:   false,
  },
];

/** Returns all holidays with their enabled status for a given set of enabled keys */
export function resolveHolidays(enabledKeys: string[]): (HolidaySeed & { enabled: boolean })[] {
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
    date:        new Date(year, h.month - 1, h.day), // month is 0-indexed in JS Date
  }));
}