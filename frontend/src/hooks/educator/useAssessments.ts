// src/hooks/educator/useAssessments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assessmentApi,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from "@/api/educator/assessment.api";

const ASSESSMENTS_KEY = "assessments";

export const useAssessments = (classId: string) => {
  return useQuery({
    queryKey: [ASSESSMENTS_KEY, classId],
    queryFn: () => assessmentApi.getAll(classId),
    enabled: !!classId,
  });
};

export const useAssessment = (classId: string, assessmentId: string) => {
  return useQuery({
    queryKey: [ASSESSMENTS_KEY, classId, assessmentId],
    queryFn: () => assessmentApi.getOne(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};

export const useCreateAssessment = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentRequest) =>
      assessmentApi.create(classId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUpdateAssessment = (classId: string) => {
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

export const useDeleteAssessment = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentApi.delete(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const usePublishAssessment = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentApi.publish(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUnpublishAssessment = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) =>
      assessmentApi.unpublish(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};