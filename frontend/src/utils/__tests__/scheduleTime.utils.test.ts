import {
  toHHmm,
  hhmmToMinutes,
  minutesToHHmm,
  formatHhmmForDisplay,
} from "@/utils/scheduleTime.utils";
import { toTimeString } from "@/api/admin/class.api";
import {
  studentClassesToScheduleClasses,
  studentEnrollmentsToScheduleClasses,
} from "@/utils/studentSchedule.utils";

// Regression: Schedule.start_time / end_time are ISO datetimes, not "HH:mm".
// Feeding the raw ISO string to the grid made toMinutes() return NaN, which
// collapsed the whole timetable into one crushed row with labels like "12nn".
//
// The fixtures below are written as UTC ISO strings deliberately. Building them
// with `new Date(2026, 3, 2, 8, 0, 0).toISOString()` would produce a DIFFERENT
// instant per timezone, so the assertion would only hold on the machine's own
// zone — which is exactly how the local-getter bug stayed invisible locally.

describe("toHHmm", () => {
  it("reads the UTC wall-clock out of an ISO datetime", () => {
    expect(toHHmm("2026-04-02T08:00:00.000Z")).toBe("08:00");
  });

  it("keeps a non-hour time", () => {
    expect(toHHmm("2026-04-02T13:45:00.000Z")).toBe("13:45");
  });

  it("does not shift an early-morning class into the afternoon", () => {
    // The reported production bug: a 07:00 UTC class rendered as 15:00 in a
    // UTC+8 browser because it was read with local getters.
    expect(toHHmm("2026-10-05T07:00:00.000Z")).toBe("07:00");
    expect(toHHmm("2026-10-05T07:00:00.000Z")).not.toBe("15:00");
  });

  it("handles an ISO datetime with no zone designator as UTC", () => {
    expect(toHHmm("2026-04-02T08:00:00")).toBe("08:00");
    expect(toHHmm("2026-04-02T08:00")).toBe("08:00");
  });

  it("converts an explicit non-UTC offset to its true UTC wall-clock", () => {
    // 07:00 at +08:00 is 23:00Z on the previous day.
    expect(toHHmm("2026-04-02T07:00:00+08:00")).toBe("23:00");
    expect(toHHmm("2026-04-02T07:00:00-05:00")).toBe("12:00");
  });

  it("passes an already-simple HH:mm through, zero-padded", () => {
    expect(toHHmm("8:00")).toBe("08:00");
    expect(toHHmm("08:00")).toBe("08:00");
    expect(toHHmm("08:00:00")).toBe("08:00");
  });

  it("returns empty for missing/blank/non-string values", () => {
    expect(toHHmm(undefined)).toBe("");
    expect(toHHmm(null)).toBe("");
    expect(toHHmm("")).toBe("");
    expect(toHHmm("   ")).toBe("");
    expect(toHHmm(480)).toBe("");
  });

  it("returns empty for an unparseable string", () => {
    expect(toHHmm("not-a-time")).toBe("");
  });
});

describe("hhmmToMinutes", () => {
  it("converts plain HH:mm", () => {
    expect(hhmmToMinutes("07:00")).toBe(420);
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("23:59")).toBe(1439);
  });

  it("converts an ISO datetime identically to its HH:mm form", () => {
    expect(hhmmToMinutes("2026-10-05T07:00:00.000Z")).toBe(
      hhmmToMinutes("07:00"),
    );
  });

  it("returns null for unusable input", () => {
    expect(hhmmToMinutes("")).toBeNull();
    expect(hhmmToMinutes(null)).toBeNull();
    expect(hhmmToMinutes(undefined)).toBeNull();
    expect(hhmmToMinutes("garbage")).toBeNull();
  });
});

describe("minutesToHHmm", () => {
  it("round-trips through hhmmToMinutes", () => {
    for (const hhmm of ["00:00", "07:00", "12:30", "23:59"]) {
      expect(minutesToHHmm(hhmmToMinutes(hhmm)!)).toBe(hhmm);
    }
  });

  it("wraps out-of-range values instead of producing garbage", () => {
    expect(minutesToHHmm(-60)).toBe("23:00");
    expect(minutesToHHmm(1500)).toBe("01:00");
  });
});

describe("formatHhmmForDisplay", () => {
  it("renders a 12-hour label from the string, not from a Date", () => {
    expect(formatHhmmForDisplay("07:00")).toBe("7:00 AM");
    expect(formatHhmmForDisplay("13:45")).toBe("1:45 PM");
    expect(formatHhmmForDisplay("00:00")).toBe("12:00 AM");
    expect(formatHhmmForDisplay("12:00")).toBe("12:00 PM");
  });

  it("renders the same label for an ISO datetime as for its HH:mm form", () => {
    expect(formatHhmmForDisplay("2026-10-05T07:00:00.000Z")).toBe("7:00 AM");
  });

  it("returns empty for unusable input", () => {
    expect(formatHhmmForDisplay("garbage")).toBe("");
  });
});

describe("toTimeString (admin class API)", () => {
  it("extracts the UTC wall-clock from an ISO datetime", () => {
    expect(toTimeString("2026-10-05T07:00:00.000Z")).toBe("07:00");
    expect(toTimeString("2026-10-05T07:00:00.000Z")).not.toBe("15:00");
  });

  it("passes a malformed value through unchanged instead of blanking it", () => {
    // Previous behaviour: a bad row rendered as whatever it looked like, not as
    // an empty cell. Preserved so the grid does not silently lose rows.
    expect(toTimeString("garbage")).toBe("garbage");
  });

  it("round-trips HH:mm -> ISO -> HH:mm through the whole chain", () => {
    for (const hhmm of ["07:00", "09:30", "13:45", "18:00"]) {
      const iso = `2026-10-05T${hhmm}:00.000Z`;
      expect(toHHmm(iso)).toBe(hhmm);
      expect(toTimeString(iso)).toBe(hhmm);
      expect(hhmmToMinutes(toTimeString(iso))).toBe(hhmmToMinutes(hhmm));
    }
  });
});

describe("schedule adapters parse real payload shapes", () => {
  it("normalizes ISO schedule times on the student payload", () => {
    // UTC ISO literals, not `new Date(y, m, d, h).toISOString()` — the latter
    // resolves differently in every timezone and would hide a local-getter bug.
    const startTime = "2026-04-06T08:00:00.000Z";
    const endTime = "2026-04-06T09:30:00.000Z";
    const [cls] = studentClassesToScheduleClasses([
      {
        enrollmentId: "e1",
        enrollmentStatus: "active",
        class: {
          id: "c1",
          subjectId: "s1",
          subjectName: "Ethics",
          semesterId: "sem-1",
          schedules: [
            { weekday: 1, start_time: startTime, end_time: endTime },
          ],
        },
      } as never,
    ]);
    expect(cls.schedules![0].startTime).toBe("08:00");
    expect(cls.schedules![0].endTime).toBe("09:30");
  });

  it("normalizes ISO snake_case times on the admin payload", () => {
    const startTime = "2026-04-06T13:00:00.000Z";
    const endTime = "2026-04-06T16:00:00.000Z";
    const [cls] = studentEnrollmentsToScheduleClasses([
      {
        id: "e1",
        class_id: "c1",
        status: "active",
        class: {
          id: "c1",
          subject_id: "s1",
          subject: { id: "s1", name: "Thesis" },
          schedules: [
            { id: "sc1", weekday: 5, start_time: startTime, end_time: endTime },
          ],
        },
      } as never,
    ]);
    expect(cls.schedules![0].startTime).toBe("13:00");
    expect(cls.schedules![0].endTime).toBe("16:00");
  });

  it("drops a slot whose times cannot be parsed instead of emitting NaN", () => {
    const [cls] = studentClassesToScheduleClasses([
      {
        enrollmentId: "e1",
        enrollmentStatus: "active",
        class: {
          id: "c1",
          subjectId: "s1",
          subjectName: "Broken",
          semesterId: "sem-1",
          schedules: [
            { weekday: 1, startTime: "garbage", endTime: "garbage" },
            { weekday: 2, startTime: "08:00", endTime: "09:00" },
          ],
        },
      } as never,
    ]);
    expect(cls.schedules).toHaveLength(1);
    expect(cls.schedules![0].weekday).toBe(2);
  });

  it("produces parseable times for every emitted slot", () => {
    const [cls] = studentClassesToScheduleClasses([
      {
        enrollmentId: "e1",
        enrollmentStatus: "active",
        class: {
          id: "c1",
          subjectId: "s1",
          subjectName: "X",
          semesterId: "sem-1",
          schedules: [
            { weekday: 1, startTime: "08:00", endTime: "09:00" },
            { weekday: 2, startTime: "10:00", endTime: "11:00" },
          ],
        },
      } as never,
    ]);
    for (const s of cls.schedules ?? []) {
      expect(s.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(Number.isNaN(Number(s.startTime.split(":")[0]))).toBe(false);
    }
  });
});