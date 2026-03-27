// src/hooks/educator/useRubricLibrary.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";

import {
  educatorRubricApi,
  RubricCategoryInput,
  ClassRubric,          // ← add this import
} from "@/api/educator/rubric.api";

import type { Rubric } from "@/types/admin/rubric.types";  // RubricTemplate removed

const RUBRIC_KEY = "rubrics";

// 🔹 Fetch all rubric templates (backend returns Rubric[], not RubricTemplate[])
export const useRubricLibrary = (): UseQueryResult<Rubric[], Error> => {
  return useQuery({
    queryKey: [RUBRIC_KEY, "library"],
    queryFn: () => educatorRubricApi.getLibrary(),
  });
};

// 🔹 Assign rubric to a class
export const useAssignRubricToClass = (
  classId: string
): UseMutationResult<ClassRubric, Error, string> => {  // ← was void
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (rubricId: string) =>
      educatorRubricApi.assignToClass(classId, rubricId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RUBRIC_KEY, classId] });
    },
  });
};

// 🔹 Update rubric categories
export const useUpdateClassRubric = (
  classId: string
): UseMutationResult<ClassRubric, Error, RubricCategoryInput[]> => {  // ← was void
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (categories: RubricCategoryInput[]) =>
      educatorRubricApi.updateClassRubric(classId, categories),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RUBRIC_KEY, classId] });
    },
  });
};

// 🔹 Fetch class rubric
export const useClassRubric = (
  classId: string
): UseQueryResult<ClassRubric, Error> => {  // ← was Rubric, now ClassRubric for consistency
  return useQuery({
    queryKey: [RUBRIC_KEY, classId],
    queryFn: () => educatorRubricApi.getClassRubric(classId),
    enabled: !!classId,
  });
};