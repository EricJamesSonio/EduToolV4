import client from "@/api/client";
import type { Rubric } from "@/types/admin/rubric.types";

export interface RubricCategoryInput {
  id?: string;
  name: string;
  weight: number;
  type: "assessment" | "manual";
}

export interface UpdateRubricRequest {
  categories: RubricCategoryInput[];
}

export const adminRubricApi = {
  getDefault: async (): Promise<Rubric> => {
    const res = await client.get<Rubric>("/rubric");
    return res.data;
  },
  updateDefault: async (data: UpdateRubricRequest): Promise<Rubric> => {
    const res = await client.patch<Rubric>("/rubric", data);
    return res.data;
  },
};