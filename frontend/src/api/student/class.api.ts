// frontend/src/api/student/class.api.ts
import apiClient from "@/api/client";
import { toHHmm } from "@/utils/scheduleTime.utils";

export interface StudentClassSchedule {
  weekday: number;
  startTime: string; // normalized from start_time
  endTime: string;   // normalized from end_time
}

export interface StudentClassItem {
  enrollmentId: string;
  enrollmentStatus: string;
  class: {
    id: string;
    subjectId: string;
    subjectName: string | null;
    educatorId: string;
    educatorName: string | null;
    sectionId: string | null;
    schoolYearId: string;
    semesterId: string;
    capacity: number;
    enrolledCount?: number;
    schedules: StudentClassSchedule[];
  };
}

function normalizeSchedules(
  schedules: Array<Record<string, unknown>>
): StudentClassSchedule[] {
  return schedules.map((s) => ({
    weekday: s.weekday as number,
    // backend returns snake_case AND ISO datetimes — convert to "HH:mm" here
    // so every consumer (class cards, schedule grid) gets a usable time.
    // Passing the raw ISO string through rendered schedules as unparseable
    // text and collapsed the weekly grid.
    startTime: toHHmm(s.startTime ?? s.start_time),
    endTime: toHHmm(s.endTime ?? s.end_time),
  }));
}

function normalizeItem(raw: Record<string, unknown>): StudentClassItem {
  const cls = (raw.class ?? raw) as Record<string, unknown>;
  const rawSchedules = Array.isArray(cls.schedules) ? cls.schedules : [];
  const countRaw =
    cls.enrolledCount ?? cls.enrolled_count ?? (cls._count as Record<string, unknown> | undefined)?.enrollments;
  const enrolledCount =
    typeof countRaw === "number" && Number.isFinite(countRaw) ? countRaw : undefined;
  return {
    enrollmentId: raw.enrollmentId as string,
    enrollmentStatus: raw.enrollmentStatus as string,
    class: {
      id: cls.id as string,
      subjectId: cls.subjectId as string,
      subjectName: (cls.subjectName ?? null) as string | null,
      educatorId: cls.educatorId as string,
      educatorName: (cls.educatorName ?? null) as string | null,
      sectionId: (cls.sectionId ?? null) as string | null,
      schoolYearId: cls.schoolYearId as string,
      semesterId: cls.semesterId as string,
      capacity: cls.capacity as number,
      enrolledCount,
      schedules: normalizeSchedules(rawSchedules),
    },
  };
}

export const studentClassApi = {
  getAll: async (): Promise<StudentClassItem[]> => {
    const { data } = await apiClient.get("/student/classes");
    const raw: unknown[] = Array.isArray(data) ? data : (data?.data ?? []);
    return raw.map((item) => normalizeItem(item as Record<string, unknown>));
  },

  getOne: async (classId: string): Promise<StudentClassItem> => {
    const { data } = await apiClient.get(`/student/classes/${classId}`);
    const raw = Array.isArray(data?.data) ? data.data : (data?.data ?? data);
    return normalizeItem(raw as Record<string, unknown>);
  },
};