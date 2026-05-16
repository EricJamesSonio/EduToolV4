import client from "@/api/client";
import type { GradingScale, GradeRange } from "@/types/admin/grading-scale.types";

export interface CreateGradingScaleRequest {
  programId: string;
  schoolYearId: string;
  name: string;
  ranges: GradeRange[];
}

export interface UpdateGradingScaleRequest {
  name?: string;
  ranges?: GradeRange[];
}

export interface GetGradingScalesQuery {
  programId?: string;
  schoolYearId?: string;
}

export const gradingScaleApi = {
  getAll: async (query?: GetGradingScalesQuery): Promise<GradingScale[]> => {
    const res = await client.get<{ success: boolean; data: GradingScale[] }>(
      "/grading-scales",
      { params: query }
    );
    return res.data.data;
  },

  create: async (data: CreateGradingScaleRequest): Promise<GradingScale> => {
    const res = await client.post<{ success: boolean; data: GradingScale }>(
      "/grading-scales",
      data
    );
    return res.data.data;
  },

  update: async (
    id: string,
    data: UpdateGradingScaleRequest
  ): Promise<GradingScale> => {
    const res = await client.patch<{ success: boolean; data: GradingScale }>(
      `/grading-scales/${id}`,
      data
    );
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/grading-scales/${id}`);
  },

assignToProgram: async (
  programId: string,
  scaleId: string
): Promise<GradingScale> => {
  const res = await client.post<{ success: boolean; data: GradingScale }>(
    `/grading-scales/programs/${programId}/grading-scale`,
    { scaleId }
  );

  return res.data.data;
},
};