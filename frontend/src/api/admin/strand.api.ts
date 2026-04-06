// frontend/src/api/admin/strand.api.ts

import client from "@/api/client";
import type { Strand } from "@/types/admin/strand.types";

export interface CreateStrandRequest {
  schoolYearId: string;  // ← add
  program_id: string;  // matches backend CreateStrandDto field name exactly
  name: string;
}

export interface UpdateStrandRequest {
  name?: string;
}

export interface GetStrandsQuery {
  program_id?: string;
}

export const strandApi = {
  getAll: async (query?: GetStrandsQuery): Promise<Strand[]> => {
    const res = await client.get<Strand[]>("/strands", { params: query });
    return res.data;
  },

  getOne: async (id: string): Promise<Strand> => {
    const res = await client.get<Strand>(`/strands/${id}`);
    return res.data;
  },

  create: async (data: CreateStrandRequest): Promise<Strand> => {
    const res = await client.post<Strand>("/strands", data);
    return res.data;
  },

  update: async (id: string, data: UpdateStrandRequest): Promise<Strand> => {
    const res = await client.patch<Strand>(`/strands/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/strands/${id}`);
  },
};