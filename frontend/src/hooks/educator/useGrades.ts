// src/hooks/educator/useGrades.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradeApi, ManualScoreDto,  } from "@/api/educator/grade.api";
import type { TermGrades } from "@/types/educator/grade.types";

export const GRADES_KEY = "grades";

// Fetch all terms grades for a class
export const useClassGrades = (classId: string) => {
  return useQuery({
    queryKey: [GRADES_KEY, classId],
    queryFn: () => gradeApi.getByClass(classId),
    enabled: !!classId,
  });
};

// Fetch grades for a specific term
export const useTermGrades = (classId: string, termId: string) => {
  return useQuery({
    queryKey: [GRADES_KEY, classId, termId],
    queryFn: () => gradeApi.getByTerm(classId, termId),
    enabled: !!classId && !!termId,
  });
};

// Compute grades for a term
export const useComputeGrades = (classId: string, termId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => gradeApi.compute(classId, termId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GRADES_KEY, classId] });
    },
  });
};

// Update manual score for a student
export const useSetManualScore = (classId: string, termId: string, studentId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: ManualScoreDto) => gradeApi.setManualScore(classId, termId, studentId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GRADES_KEY, classId, termId] });
    },
  });
};

// Publish a single student's grades for a specific term
export const usePublishStudent = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ termId, studentId }: { termId: string; studentId: string }) =>
      gradeApi.publishStudent(classId, termId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GRADES_KEY, classId] });
    },
  });
};

// Unlock a single student's grades for a specific term
export const useUnlockStudent = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ termId, studentId }: { termId: string; studentId: string }) =>
      gradeApi.unlockStudent(classId, termId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GRADES_KEY, classId] });
    },
  });
};