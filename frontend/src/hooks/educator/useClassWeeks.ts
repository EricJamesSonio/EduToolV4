// filepath: frontend/src/hooks/educator/useClassWeeks.ts

import { useQuery } from "@tanstack/react-query";
import { educatorClassApi } from "@/api/educator/class.api";
import apiClient from "@/api/client";
import type { EducatorSemester } from "@/types/educator/semester.types";

async function fetchSemesters(): Promise<EducatorSemester[]> {
  const { data } = await apiClient.get<{ success: boolean; data: EducatorSemester[] }>("/semester-settings");
  return data.data;  // ← unwrap the nested data
}

function getCalendarWeeks(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)), 1);
}

export type WeekSlot = {
  label: string;   // "1", "2" or "1.1", "1.2"
  value: number;   // numeric index for storage: 1, 2, 3...
};

export function useClassWeeks(classId: string) {
  return useQuery({
    queryKey: ["class-weeks", classId],
    queryFn: async () => {
    const [cls, semesters] = await Promise.all([
        educatorClassApi.getOne(classId),
        fetchSemesters(),
    ]);
    console.log("cls.semester_id:", cls.semester_id);
    console.log("semesters:", semesters);

      const semester = semesters.find((s) => s.id === cls.semester_id);
      if (!semester) return [{ label: "1", value: 1 }] satisfies WeekSlot[];

      const calendarWeeks = getCalendarWeeks(
        semester.start_date,
        semester.end_date
      );

      // Count distinct weekdays this class meets
      const schedules = cls.schedules ?? [];
      const distinctWeekdays = new Set(schedules.map((s) => s.weekday)).size;
      const meetingsPerWeek = Math.max(distinctWeekdays, 1);

      const slots: WeekSlot[] = [];

      if (meetingsPerWeek === 1) {
        // Simple: Week 1, Week 2, ... Week N
        for (let w = 1; w <= calendarWeeks; w++) {
          slots.push({ label: String(w), value: w });
        }
      } else {
        // e.g. 2 meetings/week → 1.1, 1.2, 2.1, 2.2, ...
        let slotIndex = 1;
        for (let w = 1; w <= calendarWeeks; w++) {
          for (let m = 1; m <= meetingsPerWeek; m++) {
            slots.push({ label: `${w}.${m}`, value: slotIndex++ });
          }
        }
      }

      return slots;
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}