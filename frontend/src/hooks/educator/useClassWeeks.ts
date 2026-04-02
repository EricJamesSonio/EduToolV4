// filepath: frontend/src/hooks/educator/useClassWeeks.ts

import { useQuery } from "@tanstack/react-query";
import { educatorClassApi } from "@/api/educator/class.api";
import apiClient from "@/api/client";
import type { EducatorSemester } from "@/types/educator/semester.types";

async function fetchSemesters(): Promise<EducatorSemester[]> {
  const { data } = await apiClient.get<EducatorSemester[]>("/semester-settings");
  return data;
}

function getWeekCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
  return Math.max(weeks, 1);
}

export function useClassWeeks(classId: string) {
  return useQuery({
    queryKey: ["class-weeks", classId],
    queryFn: async () => {
      const [cls, semesters] = await Promise.all([
        educatorClassApi.getOne(classId),
        fetchSemesters(),
      ]);

      const semester = semesters.find((s) => s.id === cls.semester_id);
      if (!semester) return [1];

      const count = getWeekCount(semester.start_date, semester.end_date);
      return Array.from({ length: count }, (_, i) => i + 1);
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}