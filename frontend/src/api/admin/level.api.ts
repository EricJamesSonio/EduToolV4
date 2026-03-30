import client from "@/api/client";
import type { Level } from "@/types/admin/level.types";

export const levelApi = {
  getBySchoolYear: async (schoolYearId: string): Promise<Level[]> => {
    const res = await client.get<{ success: boolean; data: Level[] }>(
      "/levels",
      { params: { schoolYearId } }
    );
    return res.data.data;
  },

  updateOne: async (id: string, name: string): Promise<Level> => {
    const res = await client.patch<{ success: boolean; data: Level }>(
      `/levels/${id}`,
      { name }
    );
    return res.data.data;
  },

  create: async (data: {
    programId: string;
    name: string;
    schoolYearId: string;
  }): Promise<Level> => {
    const res = await client.post<{ success: boolean; data: Level }>(
      "/levels",
      data
    );
    return res.data.data;
  },

  deleteOne: async (id: string): Promise<void> => {
    await client.delete(`/levels/${id}`);
  },
};