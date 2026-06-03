import apiClient from "@/api/client";

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

import type { CategoryBreakdown } from "@/types/educator/grade.types";

export interface StudentTermGrade {
  termId: string;
  termName: string;
  semesterName?: string;
  semesterIndex?: number;
  finalScore: number | null;
  finalGrade: string | null;
  isReleased: boolean;
  categoryBreakdown: CategoryBreakdown[];
}

export const studentGradeApi = {
  getOwn: async (classId: string): Promise<StudentTermGrade[]> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/grades`
    );
    return unwrap<StudentTermGrade[]>(data);
  },
};