// src/hooks/educator/useRubricLibrary.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { educatorRubricApi, RubricCategoryInput } from "@/api/educator/rubric.api";

const RUBRIC_KEY = "rubrics";

// Fetch all rubric templates
export const useRubricLibrary = () => {
  return useQuery({
    queryKey: [RUBRIC_KEY, "library"],
    queryFn: () => educatorRubricApi.getLibrary(),
  });
};

// Assign rubric to a class
export const useAssignRubricToClass = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (rubricId: string) => educatorRubricApi.assignToClass(classId, rubricId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RUBRIC_KEY, classId] });
    },
  });
};

// Update rubric categories for a class
export const useUpdateClassRubric = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (categories: RubricCategoryInput[]) =>
      educatorRubricApi.updateClassRubric(classId, categories),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RUBRIC_KEY, classId] });
    },
  });
};

// Fetch assigned rubric for a class
export const useClassRubric = (classId: string) => {
  return useQuery({
    queryKey: [RUBRIC_KEY, classId],
    queryFn: () => educatorRubricApi.getClassRubric(classId),
    enabled: !!classId,
  });
};