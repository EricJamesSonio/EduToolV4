import { getCurrentSemesterId } from "@/utils/semester.utils";

describe("getCurrentSemesterId", () => {
  const now = Date.now();
  const d = (offsetDays: number) =>
    new Date(now + offsetDays * 24 * 60 * 60 * 1000).toISOString();

  it("returns the semester containing today", () => {
    expect(
      getCurrentSemesterId([
        { id: "past", startDate: d(-60), endDate: d(-1) },
        { id: "now", startDate: d(-5), endDate: d(30) },
        { id: "next", startDate: d(40), endDate: d(90) },
      ]),
    ).toBe("now");
  });

  it("returns null when no semester contains today (no fallback)", () => {
    expect(
      getCurrentSemesterId([
        { id: "past", startDate: d(-60), endDate: d(-1) },
        { id: "next", startDate: d(40), endDate: d(90) },
      ]),
    ).toBeNull();
  });

  it("returns null when every semester has ended", () => {
    expect(
      getCurrentSemesterId([
        { id: "old", startDate: d(-120), endDate: d(-90) },
        { id: "recent", startDate: d(-60), endDate: d(-1) },
      ]),
    ).toBeNull();
  });

  it("returns null when there are no semesters", () => {
    expect(getCurrentSemesterId([])).toBeNull();
    expect(getCurrentSemesterId(undefined)).toBeNull();
  });
});
