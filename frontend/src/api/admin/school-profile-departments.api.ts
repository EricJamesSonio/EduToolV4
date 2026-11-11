import client from "@/api/client";
import type { ProgramType } from "@/types/admin/program.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface SchoolProfileDepartmentSummary {
  type: ProgramType;
}

export const schoolProfileDepartmentsApi = {
  getDepartments: async (): Promise<SchoolProfileDepartmentSummary[]> => {
    const res = await client.get<ApiEnvelope<SchoolProfileDepartmentSummary[]>>(
      "/school-profile/departments",
    );
    return res.data.data;
  },
};