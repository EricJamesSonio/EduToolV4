import client from "@/api/client";
import type { LevelDefault, SchoolYearLevel } from "@/types/admin/level.types";

export interface UpdateDefaultLevelsRequest {
  levels: Array<{ id?: string; programId: string; name: string }>;
}

export const levelApi = {
  getDefaults: async (): Promise<LevelDefault[]> => {
    const res = await client.get<LevelDefault[]>("/levels/defaults");
    return res.data;
  },
  updateDefaults: async (data: UpdateDefaultLevelsRequest): Promise<LevelDefault[]> => {
    const res = await client.patch<LevelDefault[]>("/levels/defaults", data);
    return res.data;
  },
  getByYear: async (schoolYearId: string): Promise<SchoolYearLevel[]> => {
    const res = await client.get<SchoolYearLevel[]>("/levels", { params: { schoolYearId } });
    return res.data;
  },
  update: async (id: string, name: string): Promise<SchoolYearLevel> => {
    const res = await client.patch<SchoolYearLevel>(`/levels/${id}`, { name });
    return res.data;
  },
};