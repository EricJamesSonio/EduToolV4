import apiClient from "@/api/client";

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
    schedules: Array<{
      weekday: number;
      startTime: string;
      endTime: string;
    }>;
  };
}

export const studentClassApi = {
  getAll: async (): Promise<StudentClassItem[]> => {
    const { data } = await apiClient.get("/student/classes");
    return data;
  },

  getOne: async (classId: string): Promise<StudentClassItem> => {
    const { data } = await apiClient.get(`/student/classes/${classId}`);
    return data;
  },
};