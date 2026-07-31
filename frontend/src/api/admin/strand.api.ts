// frontend/src/api/admin/strand.api.ts
import client from "@/api/client";
import type { Strand } from "@/types/admin/strand.types";

export interface CreateStrandRequest {
  schoolYearId: string;
  program_id: string;
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
    const res = await client.get<{ success: boolean; data: Strand[] }>("/strands", { params: query });
    return res.data.data;
  },
  getOne: async (id: string): Promise<Strand> => {
    const res = await client.get<{ success: boolean; data: Strand }>(`/strands/${id}`);
    return res.data.data;
  },
  create: async (data: CreateStrandRequest): Promise<Strand> => {
    const res = await client.post<{ success: boolean; data: Strand }>("/strands", data);
    return res.data.data;
  },
  update: async (id: string, data: UpdateStrandRequest): Promise<Strand> => {
    const res = await client.patch<{ success: boolean; data: Strand }>(`/strands/${id}`, data);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await client.delete(`/strands/${id}`);
  },
};