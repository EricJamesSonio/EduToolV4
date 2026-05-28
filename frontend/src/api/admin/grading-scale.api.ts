import client from "@/api/client";
import type {
  GradingScale,
  GradeRange,
  GradingScaleAssignment,
} from "@/types/admin/grading-scale.types";

export interface CreateGradingScaleRequest {
  programType: string;
  name: string;
  ranges: GradeRange[];
}

export interface UpdateGradingScaleRequest {
  name?: string;
  ranges?: GradeRange[];
}

export interface GetGradingScalesQuery {
  programType?: string;
}

export interface AssignGradingScaleRequest {
  scaleId: string;
  schoolYearId: string;
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
    scaleId: string,
    schoolYearId: string
  ): Promise<GradingScale> => {
    const res = await client.post<{ success: boolean; data: GradingScale }>(
      `/grading-scales/programs/${programId}/grading-scale`,
      { scaleId, schoolYearId }
    );
    return res.data.data;
  },

  getAssignments: async (
    schoolYearId: string
  ): Promise<GradingScaleAssignment[]> => {
    const res = await client.get<{ success: boolean; data: GradingScaleAssignment[] }>(
      "/grading-scales/assignments",
      { params: { schoolYearId } }
    );
    return res.data.data;
  },

  removeAssignment: async (
    programId: string,
    schoolYearId: string
  ): Promise<void> => {
    await client.delete("/grading-scales/assignments", {
      params: { programId, schoolYearId },
    });
  },
};
