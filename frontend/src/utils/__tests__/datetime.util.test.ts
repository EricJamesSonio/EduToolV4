import {
  ORG_TIMEZONE,
  todayInZone,
  calendarDateOf,
  calendarDateToUtc,
  addDaysToCalendarDate,
  startOfDayInZone,
  endOfDayInZone,
  formatInZone,
  formatCalendarDate,
  localInputToIso,
  isoToLocalInput,
  normalizeDateInput,
  weekdayInZone,
  weekdayOccurrencesInZone,
} from "../datetime.util";

/**
 * TICK-INFRA-017 — frontend half of the timezone-independence proof.
 * Must produce byte-identical results under TZ=UTC, TZ=Asia/Manila,
 * TZ=America/Los_Angeles, TZ=Pacific/Kiritimati (see package.json test:tz).
 */
describe("datetime.util (timezone-invariant)", () => {
  it("pins the single school timezone", () => {
    expect(ORG_TIMEZONE).toBe("Asia/Manila");
  });

  it("converts picker values as Manila wall-clock under any process TZ", () => {
    expect(localInputToIso("2026-10-06T17:00")).toBe("2026-10-06T09:00:00.000Z");
    expect(localInputToIso("2026-10-06T00:00")).toBe("2026-10-05T16:00:00.000Z");
    expect(() => localInputToIso("2026-10-06T17:00:00.000Z")).toThrow();
    expect(() => localInputToIso("2026-10-06")).toThrow();
  });

  it("pre-fills edit forms back in Manila wall-clock", () => {
    expect(isoToLocalInput("2026-10-06T09:00:00.000Z")).toBe("2026-10-06T17:00");
    expect(isoToLocalInput("2026-10-06T17:00:00+08:00")).toBe("2026-10-06T17:00");
  });

  it("round-trips picker -> ISO -> picker", () => {
    const picker = "2026-10-06T17:00";
    expect(isoToLocalInput(localInputToIso(picker))).toBe(picker);
  });

  it("todayInZone respects the Manila day boundary", () => {
    expect(todayInZone("Asia/Manila", new Date("2026-10-06T23:30:00.000Z"))).toBe(
      "2026-10-07"
    );
    expect(todayInZone("Asia/Manila", new Date("2026-10-06T00:30:00.000Z"))).toBe(
      "2026-10-06"
    );
  });

  it("calendarDateOf tolerates legacy 16:00Z rows", () => {
    expect(calendarDateOf(new Date("2026-10-06T00:00:00.000Z"))).toBe("2026-10-06");
    expect(calendarDateOf(new Date("2026-10-05T16:00:00.000Z"))).toBe("2026-10-06");
  });

  it("calendarDateToUtc stores UTC midnight; addDays is pure calendar math", () => {
    expect(calendarDateToUtc("2026-10-06").toISOString()).toBe(
      "2026-10-06T00:00:00.000Z"
    );
    expect(addDaysToCalendarDate("2026-10-06", 1)).toBe("2026-10-07");
    expect(addDaysToCalendarDate("2026-10-06", -6)).toBe("2026-09-30");
  });

  it("bounds the Manila day as UTC instants", () => {
    expect(startOfDayInZone(new Date("2026-10-06T09:00:00.000Z")).toISOString()).toBe(
      "2026-10-05T16:00:00.000Z"
    );
    expect(endOfDayInZone(new Date("2026-10-06T09:00:00.000Z")).toISOString()).toBe(
      "2026-10-06T15:59:59.999Z"
    );
  });

  it("formatInZone renders the same string on SSR and in any browser zone", () => {
    const rendered = formatInZone("2026-10-06T09:00:00.000Z");
    expect(rendered).toContain("5:00 PM");
    expect(rendered).toContain("Oct 6, 2026");
    expect(formatInZone(new Date("2026-10-06T09:00:00.000Z"))).toBe(rendered);
  });

  it("formatCalendarDate never shifts a date-only value", () => {
    expect(formatCalendarDate("2026-10-06")).toBe("Oct 6, 2026");
    expect(formatCalendarDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("normalizeDateInput loads a legacy 16:00Z row as its intended day", () => {
    // What the API returns for kind-B columns in both row conventions.
    expect(normalizeDateInput("2026-10-06T00:00:00.000Z")).toBe("2026-10-06");
    expect(normalizeDateInput("2026-10-05T16:00:00.000Z")).toBe("2026-10-06");
    // Date-only strings (native date inputs) pass through untouched.
    expect(normalizeDateInput("2026-10-06")).toBe("2026-10-06");
    expect(normalizeDateInput(null)).toBe("");
    expect(normalizeDateInput("")).toBe("");
    expect(normalizeDateInput("not-a-date")).toBe("");
  });

  it("round-trips a legacy row through an edit form back to the same stored day", () => {
    // Simulates every kind-B edit form: load legacy ISO -> normalize for
    // <input type="date"> -> submit the YYYY-MM-DD string -> stored UTC
    // midnight. A blind slice(0, 10) would have submitted 2026-10-05.
    const loaded = normalizeDateInput("2026-10-05T16:00:00.000Z");
    expect(loaded).toBe("2026-10-06");
    expect(/^\d{4}-\d{2}-\d{2}$/.test(loaded)).toBe(true);
    expect(calendarDateToUtc(loaded).toISOString()).toBe(
      "2026-10-06T00:00:00.000Z",
    );
  });

  it("reads Manila weekdays and lists occurrences identically everywhere", () => {
    expect(weekdayInZone("2026-10-06")).toBe(2);
    expect(weekdayOccurrencesInZone("2026-10-01", "2026-10-31", 1)).toEqual([
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);
  });
});
