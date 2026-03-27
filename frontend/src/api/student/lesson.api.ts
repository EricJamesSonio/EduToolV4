import apiClient from "@/api/client";

export interface StudentLesson {
  id: string;
  title: string;
  description: string | null;
  weekNumber: number;
  subIndex: number;
  detail: string;
}

export const studentLessonApi = {
  getAll: async (
    classId: string,
    weekNumber?: number
  ): Promise<StudentLesson[]> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/lessons`,
      { params: weekNumber !== undefined ? { weekNumber } : undefined }
    );
    return data;
  },

  getOne: async (
    classId: string,
    lessonId: string
  ): Promise<StudentLesson> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/lessons/${lessonId}`
    );
    return data;
  },
};