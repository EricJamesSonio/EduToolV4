// frontend/src/api/student/class.api.ts
import apiClient from "@/api/client";

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
    schedules: StudentClassSchedule[];
  };
}

function normalizeSchedules(
  schedules: Array<Record<string, unknown>>
): StudentClassSchedule[] {
  return schedules.map((s) => ({
    weekday: s.weekday as number,
    // backend returns snake_case — normalize to camelCase here
    startTime: (s.startTime ?? s.start_time ?? "") as string,
    endTime: (s.endTime ?? s.end_time ?? "") as string,
  }));
}

function normalizeItem(raw: Record<string, unknown>): StudentClassItem {
  const cls = (raw.class ?? raw) as Record<string, unknown>;
  const rawSchedules = Array.isArray(cls.schedules) ? cls.schedules : [];
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