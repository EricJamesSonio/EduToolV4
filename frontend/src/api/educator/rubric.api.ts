import client from "@/api/client";
import type { Rubric } from "@/types/admin/rubric.types";

export interface RubricCategoryInput {
  id?: string;
  name: string;
  weight: number;
  type: "assessment" | "manual";
}

export interface CreateRubricTemplateRequest {
  name: string;
  categories: RubricCategoryInput[];
}

export interface UpdateRubricTemplateRequest {
  name?: string;
  categories?: RubricCategoryInput[];
}

export interface ClassRubric extends Rubric {
  classId: string;
}

export const educatorRubricApi = {
  getLibrary: async (): Promise<Rubric[]> => {
    const res = await client.get<Rubric[]>("/rubric/library");
    return res.data;
  },
  create: async (data: CreateRubricTemplateRequest): Promise<Rubric> => {
    const res = await client.post<Rubric>("/rubric/library", data);
    return res.data;
  },
  update: async (id: string, data: UpdateRubricTemplateRequest): Promise<Rubric> => {
    const res = await client.patch<Rubric>(`/rubric/library/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/rubric/library/${id}`);
  },
  getClassRubric: async (classId: string): Promise<ClassRubric> => {
    const res = await client.get<ClassRubric>(`/classes/${classId}/rubric`);
    return res.data;
  },
  assignToClass: async (classId: string, rubricId: string): Promise<ClassRubric> => {
    const res = await client.post<ClassRubric>(`/classes/${classId}/rubric`, {
      rubricId,
    });
    return res.data;
  },
  updateClassRubric: async (
    classId: string,
    categories: RubricCategoryInput[]
  ): Promise<ClassRubric> => {
    const res = await client.patch<ClassRubric>(`/classes/${classId}/rubric`, {
      categories,
    });
    return res.data;
  },
};