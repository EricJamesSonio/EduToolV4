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
} from "@/api/educator/rubric.api";

import type { Rubric, RubricTemplate } from "@/types/admin/rubric.types";

const RUBRIC_KEY = "rubrics";

// 🔹 Fetch all rubric templates
export const useRubricLibrary = (): UseQueryResult<
  RubricTemplate[],
  Error
> => {
  return useQuery({
    queryKey: [RUBRIC_KEY, "library"],
    queryFn: () => educatorRubricApi.getLibrary(),
  });
};

// 🔹 Assign rubric to a class
export const useAssignRubricToClass = (
  classId: string
): UseMutationResult<void, Error, string> => {
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
): UseMutationResult<void, Error, RubricCategoryInput[]> => {
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
): UseQueryResult<Rubric, Error> => {
  return useQuery({
    queryKey: [RUBRIC_KEY, classId],
    queryFn: () => educatorRubricApi.getClassRubric(classId),
    enabled: !!classId,
  });
};