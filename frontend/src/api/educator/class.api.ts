import client from "@/api/client";
import type { EducatorClass } from "@/types/educator/class.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const educatorClassApi = {
  /**
   * GET /educator/classes
   * Returns the educator's own assigned classes (filtered server-side by educatorId).
   */
  getMyClasses: async (): Promise<EducatorClass[]> => {
    const res = await client.get<ApiResponse<EducatorClass[]>>("/educator/classes");
    return res.data.data;
  },

  /**
   * GET /classes/:id
   * Single class detail — accessible to both admin and educator.
   */
  getOne: async (classId: string): Promise<EducatorClass> => {
    const res = await client.get<ApiResponse<EducatorClass>>(`/classes/${classId}`);
    return res.data.data;
  },
};