// frontend/src/api/admin/grading-scale.api.ts

import client from "@/api/client";
import type { GradingScale, GradeRange } from "@/types/admin/grading-scale.types";

export interface CreateGradingScaleRequest {
  levelId: string;
  schoolYearId: string;
  name: string;
  ranges: GradeRange[];  // now correctly typed — fields match backend GradeRangeDto
}

export interface UpdateGradingScaleRequest {
  name?: string;
  ranges?: GradeRange[];
}

export interface GetGradingScalesQuery {
  levelId?: string;
  schoolYearId?: string;
}

export const gradingScaleApi = {
  getAll: async (query?: GetGradingScalesQuery): Promise<GradingScale[]> => {
    const res = await client.get<GradingScale[]>("/grading-scales", { params: query });
    return res.data;
  },

  create: async (data: CreateGradingScaleRequest): Promise<GradingScale> => {
    const res = await client.post<GradingScale>("/grading-scales", data);
    return res.data;
  },

  update: async (id: string, data: UpdateGradingScaleRequest): Promise<GradingScale> => {
    const res = await client.patch<GradingScale>(`/grading-scales/${id}`, data);
    return res.data;
  },
};