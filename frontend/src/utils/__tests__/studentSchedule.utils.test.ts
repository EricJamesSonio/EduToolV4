import {
  studentClassesToScheduleClasses,
  studentEnrollmentsToScheduleClasses,
  hasAnySchedule,
} from "@/utils/studentSchedule.utils";
import { getDefaultSemesterId } from "@/utils/semester.utils";

describe("student schedule adapters", () => {
  const studentItem = (over: Record<string, unknown> = {}) =>
    ({
      enrollmentId: "enr-1",
      enrollmentStatus: "active",
      class: {
        id: "cls-1",
        subjectId: "sub-1",
        subjectName: "Calculus",
        educatorId: "edu-1",
        educatorName: "Mr. Cruz",
        sectionId: "sec-1",
        schoolYearId: "sy-1",
        semesterId: "sem-1",
        capacity: 30,
        schedules: [
          { weekday: 1, startTime: "08:00", endTime: "09:00" },
          { weekday: 3, startTime: "10:00", endTime: "11:30" },
        ],
        ...over,
      },
    }) as never;

  describe("studentClassesToScheduleClasses", () => {
    it("maps subject name and every schedule slot", () => {
      const [cls] = studentClassesToScheduleClasses([studentItem()]);
      expect(cls.subjectName).toBe("Calculus");
      expect(cls.schedules).toHaveLength(2);
      expect(cls.schedules![0]).toMatchObject({
        weekday: 1,
        startTime: "08:00",
        endTime: "09:00",
      });
    });

    it("synthesizes a stable schedule id (student API drops it)", () => {
      const [a] = studentClassesToScheduleClasses([studentItem()]);
      const [b] = studentClassesToScheduleClasses([studentItem()]);
      // WeeklyScheduleGrid keys blocks by schedule.id — a key that changed each
      // render would remount the block.
      expect(a.schedules![0].id).toBeTruthy();
      expect(a.schedules![0].id).toBe(b.schedules![0].id);
    });

    it("gives distinct ids to two slots of the same class", () => {
      const [cls] = studentClassesToScheduleClasses([studentItem()]);
      expect(cls.schedules![0].id).not.toBe(cls.schedules![1].id);
    });

    it("keeps an id supplied by the API", () => {
      const [cls] = studentClassesToScheduleClasses([
        studentItem({ schedules: [{ id: "sched-1", weekday: 2, startTime: "09:00", endTime: "10:00" }] }),
      ]);
      expect(cls.schedules![0].id).toBe("sched-1");
    });

    it("carries semesterId through for the semester scope", () => {
      const [cls] = studentClassesToScheduleClasses([studentItem()]);
      expect(cls.semesterId).toBe("sem-1");
    });

    it("drops removed enrollments", () => {
      const out = studentClassesToScheduleClasses([
        { enrollmentId: "e", enrollmentStatus: "removed", class: { id: "c1", subjectName: "X", subjectId: "s", semesterId: "sem-1", schedules: [] } } as never,
      ]);
      expect(out).toHaveLength(0);
    });

    it("tolerates a missing schedules array", () => {
      const [cls] = studentClassesToScheduleClasses([
        studentItem({ schedules: undefined }),
      ]);
      expect(cls.schedules).toEqual([]);
    });

    it("returns an empty array for undefined input", () => {
      expect(studentClassesToScheduleClasses(undefined)).toEqual([]);
      expect(studentEnrollmentsToScheduleClasses(undefined)).toEqual([]);
    });
  });

  describe("studentEnrollmentsToScheduleClasses (admin payload)", () => {
    const adminEnrollment = (over: Record<string, unknown> = {}) =>
      ({
        id: "enr-1",
        class_id: "cls-9",
        status: "active",
        semester_id: "sem-2",
        class: {
          id: "cls-9",
          subject_id: "sub-9",
          subject: { id: "sub-9", name: "Physics" },
          schedules: [{ weekday: 2, start_time: "13:00", end_time: "14:00" }],
          ...over,
        },
      }) as never;

    it("reads snake_case schedule fields off the admin payload", () => {
      const [cls] = studentEnrollmentsToScheduleClasses([adminEnrollment()]);
      expect(cls.subjectName).toBe("Physics");
      expect(cls.schedules![0]).toMatchObject({
        weekday: 2,
        startTime: "13:00",
        endTime: "14:00",
      });
    });

    it("falls back to class_id when the class relation is missing", () => {
      const out = studentEnrollmentsToScheduleClasses([
        { id: "e", class_id: "cls-x", status: "active" } as never,
      ]);
      expect(out[0].id).toBe("cls-x");
      expect(out[0].schedules).toEqual([]);
    });
  });

  describe("hasAnySchedule", () => {
    it("is false when no class has schedule times", () => {
      expect(hasAnySchedule(studentClassesToScheduleClasses([studentItem({ schedules: [] })]))).toBe(false);
    });

    it("is true when at least one class has schedule times", () => {
      expect(hasAnySchedule(studentClassesToScheduleClasses([studentItem()]))).toBe(true);
    });

    it("is false for an empty list", () => {
      expect(hasAnySchedule([])).toBe(false);
      expect(hasAnySchedule(undefined)).toBe(false);
    });
  });
});

describe("getDefaultSemesterId", () => {
  const now = Date.now();
  const d = (offsetDays: number) =>
    new Date(now + offsetDays * 24 * 60 * 60 * 1000).toISOString();

  it("prefers the semester containing today", () => {
    expect(
      getDefaultSemesterId([
        { id: "past", startDate: d(-60), endDate: d(-1) },
        { id: "now", startDate: d(-5), endDate: d(30) },
        { id: "next", startDate: d(40), endDate: d(90) },
      ]),
    ).toBe("now");
  });

  it("falls back to the next upcoming semester", () => {
    expect(
      getDefaultSemesterId([
        { id: "past", startDate: d(-60), endDate: d(-1) },
        { id: "next", startDate: d(40), endDate: d(90) },
      ]),
    ).toBe("next");
  });

  it("falls back to the most recently ended semester", () => {
    expect(
      getDefaultSemesterId([
        { id: "old", startDate: d(-120), endDate: d(-90) },
        { id: "recent", startDate: d(-60), endDate: d(-1) },
      ]),
    ).toBe("recent");
  });

  it("returns null when there are no semesters", () => {
    expect(getDefaultSemesterId([])).toBeNull();
    expect(getDefaultSemesterId(undefined)).toBeNull();
  });
});