export interface EducatorClassSchedule {
  id: string;
  classId: string;
  weekday: number; // 0 = Sunday … 6 = Saturday
  startTime: string; // ISO datetime string from Prisma
  endTime: string;
}

// Raw shape returned by GET /educator/classes
// (findActiveClassesByEducator — no subject/section enrichment)
export interface EducatorClass {
  id: string;
  org_id: string;
  subject_id: string;
  educator_id: string;
  section_id: string | null;
  school_year_id: string;
  semester_id: string;
  capacity: number; // 0 = unlimited
  deleted_at: string | null;
  schedules: EducatorClassSchedule[] | undefined;
}

// Enriched shape built on the frontend by joining lookup data
export interface EducatorClassEnriched extends EducatorClass {
  subjectName: string | null;
  sectionName: string | null;
  semesterName: string | null;
  schoolYearName: string | null;
}

/** Weekday label helpers */
export const WEEKDAY_LABELS = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
] as const;

export function formatSchedules(schedules: EducatorClassSchedule[] | undefined | null): string {
  if (!schedules?.length) return "No schedule";
  return schedules
    .map((s) => {
      const day = WEEKDAY_LABELS[s.weekday] ?? "?";
      const fmt = (iso: string) =>
        new Date(iso).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      return `${day} ${fmt(s.startTime)}–${fmt(s.endTime)}`;
    })
    .join(", ");
}