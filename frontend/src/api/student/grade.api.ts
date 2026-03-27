import apiClient from "@/api/client";

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
    return data;
  },
};