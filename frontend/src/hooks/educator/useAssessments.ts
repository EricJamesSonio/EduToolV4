import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import {
  assessmentApi,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from "@/api/educator/assessment.api";
import type { Assessment } from "@/types/educator/assessment.types";

const ASSESSMENTS_KEY = "assessments";

export const useAssessments = (classId: string): UseQueryResult<Assessment[], Error> => {
  return useQuery({
    queryKey: [ASSESSMENTS_KEY, classId],
    queryFn: () => assessmentApi.getAll(classId),
    enabled: !!classId,
  });
};

export const useAssessment = (classId: string, assessmentId: string): UseQueryResult<Assessment, Error> => {
  return useQuery({
    queryKey: [ASSESSMENTS_KEY, classId, assessmentId],
    queryFn: () => assessmentApi.getOne(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};

export const useCreateAssessment = (classId: string): UseMutationResult<Assessment, Error, CreateAssessmentRequest> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentRequest) =>
      assessmentApi.create(classId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUpdateAssessment = (
  classId: string
): UseMutationResult<Assessment, Error, { assessmentId: string; data: UpdateAssessmentRequest }> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: UpdateAssessmentRequest;
    }) => assessmentApi.update(classId, assessmentId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
      qc.invalidateQueries({
        queryKey: [ASSESSMENTS_KEY, classId, vars.assessmentId],
      });
    },
  });
};

export const useDeleteAssessment = (classId: string): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentApi.delete(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const usePublishAssessment = (classId: string): UseMutationResult<{ success: true }, Error, string> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentApi.publish(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUnpublishAssessment = (classId: string): UseMutationResult<{ success: true }, Error, string> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentApi.unpublish(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};