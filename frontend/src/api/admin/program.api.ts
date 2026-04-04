import client from "@/api/client";
import type { Program } from "@/types/admin/program.types";

export type ProgramType =
  | "elementary"
  | "high_school"
  | "senior_high"
  | "college"
  | "custom";

export interface CreateProgramRequest {
  name: string;
  type: ProgramType;
}

export interface UpdateProgramRequest {
  name?: string;
  type?: ProgramType;
}

export const programApi = {
  getAll: async (): Promise<Program[]> => {
    const res = await client.get<{ success: boolean; data: Program[] }>(
      "/programs"
    );
    return res.data.data;
  },

  getOne: async (id: string): Promise<Program> => {
    const res = await client.get<{ success: boolean; data: Program }>(
      `/programs/${id}`
    );
    return res.data.data;
  },

  create: async (data: CreateProgramRequest): Promise<Program> => {
    const res = await client.post<{ success: boolean; data: Program }>(
      "/programs",
      data
    );
    return res.data.data;
  },

  update: async (id: string, data: UpdateProgramRequest): Promise<Program> => {
    const res = await client.patch<{ success: boolean; data: Program }>(
      `/programs/${id}`,
      data
    );
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/programs/${id}`);
  },
};