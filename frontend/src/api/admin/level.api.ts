// frontend/src/api/admin/level.api.ts
import client from "@/api/client";
import type { Level, LevelDefault } from "@/types/admin/level.types";

export interface UpdateDefaultLevelsRequest {
  levels: Array<{ id?: string; programId: string; name: string }>;
}

export const levelApi = {
  getDefaults: async (): Promise<LevelDefault[]> => {
    const res = await client.get<{ success: boolean; data: LevelDefault[] }>("/levels/defaults");
    return res.data.data;
  },

  updateDefaults: async (data: UpdateDefaultLevelsRequest): Promise<LevelDefault[]> => {
    const res = await client.patch<{ success: boolean; data: LevelDefault[] }>("/levels/defaults", data);
    return res.data.data;
  },

  getBySchoolYear: async (schoolYearId: string): Promise<Level[]> => {
    const res = await client.get<{ success: boolean; data: Level[] }>("/levels", {
      params: { schoolYearId },
    });
    return res.data.data;
  },

  getAll: async (): Promise<Level[]> => {
    const res = await client.get<{ success: boolean; data: Level[] }>("/levels");
    return res.data.data;
  },

  updateOne: async (id: string, name: string): Promise<Level> => {
    const res = await client.patch<{ success: boolean; data: Level }>(`/levels/${id}`, { name });
    return res.data.data;
  },

  create: async (data: { programId: string; name: string; schoolYearId: string }): Promise<Level> => {
    const res = await client.post<{ success: boolean; data: Level }>("/levels", data);
    return res.data.data;
  },

  deleteOne: async (id: string): Promise<void> => {
    await client.delete(`/levels/${id}`);
  },

  bulkGenerate: async (data: {
    programId: string;
    schoolYearId: string;
    count: number;
  }): Promise<Level[]> => {
    const res = await client.post<{ success: boolean; data: Level[] }>(
      '/levels/bulk-generate',
      data,
    );
    return res.data.data;
  },
};