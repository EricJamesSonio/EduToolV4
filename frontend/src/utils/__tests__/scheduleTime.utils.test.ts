import { toHHmm } from "@/utils/scheduleTime.utils";
import {
  studentClassesToScheduleClasses,
  studentEnrollmentsToScheduleClasses,
} from "@/utils/studentSchedule.utils";

// Regression: Schedule.start_time / end_time are ISO datetimes, not "HH:mm".
// Feeding the raw ISO string to the grid made toMinutes() return NaN, which
// collapsed the whole timetable into one crushed row with labels like "12nn".

describe("toHHmm", () => {
  it("converts an ISO datetime to local HH:mm", () => {
    const iso = new Date(2026, 3, 2, 8, 0, 0).toISOString();
    expect(toHHmm(iso)).toBe("08:00");
  });

  it("converts a non-hour time", () => {
    const iso = new Date(2026, 3, 2, 13, 45, 0).toISOString();
    expect(toHHmm(iso)).toBe("13:45");
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

describe("schedule adapters parse real payload shapes", () => {
  it("normalizes ISO schedule times on the student payload", () => {
    const startTime = new Date(2026, 3, 6, 8, 0, 0).toISOString();
    const endTime = new Date(2026, 3, 6, 9, 30, 0).toISOString();
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
    const startTime = new Date(2026, 3, 6, 13, 0, 0).toISOString();
    const endTime = new Date(2026, 3, 6, 16, 0, 0).toISOString();
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