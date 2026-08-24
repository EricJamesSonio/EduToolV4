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

export interface GroupedSemester {
  semesterId: string;
  semesterName: string;
  programId: string;
  programName: string;
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

interface RawGroupedSemester {
  semesterId: string;
  semesterName: string;
  programId: string;
  programName: string;
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

  // NEW — for the Classes page "All Departments" semester filter. One row
  // per (program, semester) pairing that actually exists for the given
  // school year, so the dropdown can show disambiguated labels like
  // "1st - College" / "1st - Daycare".
  getSemestersGrouped: async (schoolYearId: string): Promise<GroupedSemester[]> => {
    const res = await client.get<ApiEnvelope<RawGroupedSemester[]>>(
      "/programs/semesters/grouped",
      { params: { schoolYearId } },
    );
    return res.data?.data ?? [];
  },
};