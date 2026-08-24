import client from "@/api/client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ShiftProgramRequest {
  toProgramId: string;
  levelId?: string;
  courseId?: string;
  strandId?: string;
  sectionId?: string;
  perClassOutcomeOverrides?: { enrollmentId: string; outcome: string; reason?: string }[];
}

export const programShiftApi = {
  shift: async (
    schoolYearId: string,
    studentSchoolYearId: string,
    data: ShiftProgramRequest,
  ): Promise<unknown> => {
    const res = await client.post<ApiResponse<unknown>>(
      `/school-years/${schoolYearId}/enrollments/${studentSchoolYearId}/shift`,
      data,
    );
    return res.data.data;
  },
};
