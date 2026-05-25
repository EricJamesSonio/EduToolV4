// frontend/src/api/admin/program.api.ts

import client from "@/api/client";
import type { Program, ProgramType } from "@/types/admin/program.types";

export type { ProgramType };

export interface CreateProgramRequest {
  schoolYearId: string;
  name: string;
  type: ProgramType;
}

export interface UpdateProgramRequest {
  name?: string;
  type?: ProgramType;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface RawProgram {
  id: string;
  org_id: string;
  school_year_id: string;
  name: string;
  type: ProgramType;
  courses?: { id: string; name: string; code: string | null }[];
  strands?: { id: string; name: string }[];
}

function mapProgram(raw: RawProgram): Program {
  return {
    id: raw.id,
    orgId: raw.org_id,
    schoolYearId: raw.school_year_id,
    school_year_id: raw.school_year_id,
    name: raw.name,
    type: raw.type,
    courses: raw.courses ?? [],
    strands: raw.strands ?? [],
  };
}

export const programApi = {
  getAll: async (schoolYearId: string): Promise<Program[]> => {
    const res = await client.get<ApiEnvelope<RawProgram[]>>("/programs", {
      params: { schoolYearId },
    });

    const rawList = res.data?.data ?? [];
    return rawList.map(mapProgram);
  },

  getOne: async (id: string): Promise<Program> => {
    const res = await client.get<ApiEnvelope<RawProgram>>(`/programs/${id}`);
    return mapProgram(res.data.data);
  },

  create: async (data: CreateProgramRequest): Promise<Program> => {
    const res = await client.post<ApiEnvelope<RawProgram>>("/programs", data);
    return mapProgram(res.data.data);
  },

  update: async (id: string, data: UpdateProgramRequest): Promise<Program> => {
    const res = await client.patch<ApiEnvelope<RawProgram>>(`/programs/${id}`, data);
    return mapProgram(res.data.data);
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/programs/${id}`);
  },
};