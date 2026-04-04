import apiClient from "@/api/client";

export interface StudentLesson {
  id: string;
  title: string;
  description: string | null;
  weekNumber: number;
  subIndex: number;
  detail: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLesson(l: any): StudentLesson {
  return {
    id: l.id,
    title: l.title,
    description: l.description ?? null,
    detail: l.detail,
    weekNumber: l.week_number,
    subIndex: l.sub_index,
  };
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
    const items = Array.isArray(data) ? data : (data?.data ?? []);
    return items.map(mapLesson);
  },

  getOne: async (
    classId: string,
    lessonId: string
  ): Promise<StudentLesson> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/lessons/${lessonId}`
    );
    const l = data?.data ?? data;
    return mapLesson(l);
  },
};