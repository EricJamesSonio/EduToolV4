import { getCurrentSemesterId } from "@/utils/semester.utils";
import { todayInZone } from "@/utils/datetime.util";

describe("getCurrentSemesterId", () => {
  // TICK-INFRA-017: day-granular fixtures anchored on the Manila school day
  // (what the API returns for kind-B rows). Deterministic under every
  // process TZ — intraday offsets flip around UTC midnight.
  const day = (offsetDays: number): string => {
    const base = new Date(
      Date.parse(`${todayInZone()}T00:00:00.000Z`) +
        offsetDays * 24 * 60 * 60 * 1000,
    );
    return base.toISOString();
  };

  it("returns the semester containing today", () => {
    expect(
      getCurrentSemesterId([
        { id: "past", startDate: day(-60), endDate: day(-1) },
        { id: "now", startDate: day(-5), endDate: day(30) },
        { id: "next", startDate: day(40), endDate: day(90) },
      ]),
    ).toBe("now");
  });

  it("counts a semester ending today as still current (R6)", () => {
    expect(
      getCurrentSemesterId([
        { id: "ending-today", startDate: day(-30), endDate: day(0) },
        { id: "next", startDate: day(40), endDate: day(90) },
      ]),
    ).toBe("ending-today");
  });

  it("returns null when no semester contains today (no fallback)", () => {
    expect(
      getCurrentSemesterId([
        { id: "past", startDate: day(-60), endDate: day(-1) },
        { id: "next", startDate: day(40), endDate: day(90) },
      ]),
    ).toBeNull();
  });

  it("returns null when every semester has ended", () => {
    expect(
      getCurrentSemesterId([
        { id: "old", startDate: day(-120), endDate: day(-90) },
        { id: "recent", startDate: day(-60), endDate: day(-1) },
      ]),
    ).toBeNull();
  });

  it("returns null when there are no semesters", () => {
    expect(getCurrentSemesterId([])).toBeNull();
    expect(getCurrentSemesterId(undefined)).toBeNull();
  });
});
