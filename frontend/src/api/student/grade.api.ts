import apiClient from "@/api/client";

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

export interface StudentTermGrade {
  termId: string;
  finalScore: number;
  finalGrade: string | null; // null until class is locked
  isReleased: boolean;
}

export const studentGradeApi = {
  getOwn: async (classId: string): Promise<StudentTermGrade[]> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/grades`
    );
    return unwrap<StudentTermGrade[]>(data);
  },
};