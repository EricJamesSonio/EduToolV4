// filepath: frontend/src/hooks/educator/useAssessments.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult, Query
} from "@tanstack/react-query";
import {
  assessmentApi,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
  UpdateQuestionRequest,
  GradeEssayRequest,
  UpdateSubmissionStatusRequest,
} from "@/api/educator/assessment.api";
import type { Assessment, Question } from "@/types/educator/assessment.types";
import type { Submission } from "@/types/educator/submission.types";
import { assessmentKeys, submissionKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export const useAssessments = (
  classId: string,
  filters?: { termId?: string; type?: string; weekNumber?: number },
): UseQueryResult<Assessment[], Error> => {
  return useQuery({
    queryKey: assessmentKeys.list({ classId, ...filters }),
    queryFn: () => assessmentApi.getAll(classId, filters),
    enabled: !!classId,
    staleTime: 1000 * 30, // 30 seconds for assessment lists
  });
};

export const useAssessment = (
  classId: string,
  assessmentId: string,
  options?: {
    refetchInterval?: number | false | ((query: Query<Assessment, Error>) => number | false);
  },
): UseQueryResult<Assessment, Error> => {
  return useQuery({
    queryKey: assessmentKeys.detail(assessmentId),
    queryFn: () => assessmentApi.getOne(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
    refetchInterval: options?.refetchInterval,
    staleTime: 1000 * 60 * 2, // 2 minutes for individual assessment
  });
};

export const useCreateAssessment = (
  classId: string,
): UseMutationResult<Assessment, Error, CreateAssessmentRequest> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssessmentRequest) => assessmentApi.create(classId, data),
    onSuccess: (newAssessment) => {
      qc.setQueryData(assessmentKeys.detail(newAssessment.id), newAssessment);
      qc.invalidateQueries({ queryKey: assessmentKeys.lists() });
      toast.success("Assessment created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create assessment");
    },
  });
};

export const useUpdateAssessment = (
  classId: string,
): UseMutationResult<Assessment, Error, { assessmentId: string; data: UpdateAssessmentRequest }> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, data }) => assessmentApi.update(classId, assessmentId, data),
    onMutate: async ({ assessmentId, data }) => {
      await qc.cancelQueries({ queryKey: assessmentKeys.detail(assessmentId) });

      const previousAssessment = qc.getQueryData(assessmentKeys.detail(assessmentId));

      qc.setQueryData(assessmentKeys.detail(assessmentId), (old: Assessment) =>
        old ? { ...old, ...data } : null
      );

      return { previousAssessment };
    },
    onError: (err, variables, context) => {
      if (context?.previousAssessment) {
        qc.setQueryData(assessmentKeys.detail(variables.assessmentId), context.previousAssessment);
      }
      toast.error("Failed to update assessment");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: assessmentKeys.detail(variables.assessmentId) });
      qc.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Assessment updated successfully");
    },
  });
};

export const useDeleteAssessment = (
  classId: string,
): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.delete(classId, assessmentId),
    onMutate: async (assessmentId) => {
      await qc.cancelQueries({ queryKey: assessmentKeys.detail(assessmentId) });

      const previousAssessment = qc.getQueryData(assessmentKeys.detail(assessmentId));

      // Remove from cache optimistically
      qc.removeQueries({ queryKey: assessmentKeys.detail(assessmentId) });

      return { previousAssessment };
    },
    onError: (err, variables, context) => {
      if (context?.previousAssessment) {
        qc.setQueryData(assessmentKeys.detail(variables), context.previousAssessment);
      }
      toast.error("Failed to delete assessment");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Assessment deleted successfully");
    },
  });
};

export const useUpdateQuestion = (
  classId: string,
  assessmentId: string,
): UseMutationResult<Question, Error, { questionId: string; data: UpdateQuestionRequest }> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, data }) =>
      assessmentApi.updateQuestion(classId, assessmentId, questionId, data),
    onMutate: async ({ questionId, data }) => {
      await qc.cancelQueries({ queryKey: assessmentKeys.detail(assessmentId) });

      const previousAssessment = qc.getQueryData(assessmentKeys.detail(assessmentId));

      qc.setQueryData(assessmentKeys.detail(assessmentId), (old: Assessment) =>
        old ? {
          ...old,
          questions: old.questions?.map(q =>
            q.id === questionId ? { ...q, ...data } : q
          )
        } : null
      );

      return { previousAssessment };
    },
    onError: (err, variables, context) => {
      if (context?.previousAssessment) {
        qc.setQueryData(assessmentKeys.detail(assessmentId), context.previousAssessment);
      }
      toast.error("Failed to update question");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: assessmentKeys.detail(assessmentId) });
    },
    onSuccess: () => {
      toast.success("Question updated successfully");
    },
  });
};

export const useAssessmentSubmissions = (
  classId: string,
  assessmentId: string,
): UseQueryResult<Submission[], Error> => {
  return useQuery({
    queryKey: submissionKeys.list({ assessmentId }),
    queryFn: () => assessmentApi.getSubmissions(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
    staleTime: 1000 * 15, // 15 seconds for submissions (highly dynamic)
  });
};

export const useUpdateSubmissionStatus = (
  classId: string,
  assessmentId: string,
): UseMutationResult<Submission, Error, { submissionId: string } & UpdateSubmissionStatusRequest> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, ...body }) =>
      assessmentApi.updateSubmissionStatus(classId, assessmentId, submissionId, body),
    onMutate: async ({ submissionId, ...body }) => {
      await qc.cancelQueries({ queryKey: submissionKeys.list({ assessmentId }) });

      const previousSubmissions = qc.getQueryData(submissionKeys.list({ assessmentId }));

      qc.setQueryData(submissionKeys.list({ assessmentId }), (old: Submission[] = []) =>
        old.map(submission =>
          submission.id === submissionId ? { ...submission, ...body } : submission
        )
      );

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        qc.setQueryData(submissionKeys.list({ assessmentId }), context.previousSubmissions);
      }
      toast.error("Failed to update submission status");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: submissionKeys.list({ assessmentId }) });
    },
    onSuccess: (_, variables) => {
      toast.success(`Submission status updated to ${variables.status}`);
    },
  });
};

export const useGradeEssay = (
  classId: string,
  assessmentId: string,
): UseMutationResult<Submission, Error, { submissionId: string } & GradeEssayRequest> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, ...body }) =>
      assessmentApi.gradeEssay(classId, assessmentId, submissionId, body),
    onMutate: async ({ submissionId, ...body }) => {
      await qc.cancelQueries({ queryKey: submissionKeys.list({ assessmentId }) });

      const previousSubmissions = qc.getQueryData(submissionKeys.list({ assessmentId }));

      qc.setQueryData(submissionKeys.list({ assessmentId }), (old: Submission[] = []) =>
        old.map(submission =>
          submission.id === submissionId ? { ...submission, ...body, graded: true } : submission
        )
      );

      return { previousSubmissions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSubmissions) {
        qc.setQueryData(submissionKeys.list({ assessmentId }), context.previousSubmissions);
      }
      toast.error("Failed to grade essay");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: submissionKeys.list({ assessmentId }) });
    },
    onSuccess: () => {
      toast.success("Essay graded successfully");
    },
  });
};

export const usePublishAssessment = (
  classId: string,
): UseMutationResult<{ success: true }, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.publish(classId, assessmentId),
    onMutate: async (assessmentId) => {
      await qc.cancelQueries({ queryKey: assessmentKeys.detail(assessmentId) });

      const previousAssessment = qc.getQueryData(assessmentKeys.detail(assessmentId));

      qc.setQueryData(assessmentKeys.detail(assessmentId), (old: Assessment) =>
        old ? { ...old, isPublished: true } : null
      );

      return { previousAssessment };
    },
    onError: (err, variables, context) => {
      if (context?.previousAssessment) {
        qc.setQueryData(assessmentKeys.detail(variables), context.previousAssessment);
      }
      toast.error("Failed to publish assessment");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: assessmentKeys.detail(variables) });
      qc.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Scores published successfully");
    },
  });
};

export const useUnpublishAssessment = (
  classId: string,
): UseMutationResult<{ success: true }, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.unpublish(classId, assessmentId),
    onMutate: async (assessmentId) => {
      await qc.cancelQueries({ queryKey: assessmentKeys.detail(assessmentId) });

      const previousAssessment = qc.getQueryData(assessmentKeys.detail(assessmentId));

      qc.setQueryData(assessmentKeys.detail(assessmentId), (old: Assessment) =>
        old ? { ...old, isPublished: false } : null
      );

      return { previousAssessment };
    },
    onError: (err, variables, context) => {
      if (context?.previousAssessment) {
        qc.setQueryData(assessmentKeys.detail(variables), context.previousAssessment);
      }
      toast.error("Failed to unpublish assessment");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: assessmentKeys.detail(variables) });
      qc.invalidateQueries({ queryKey: assessmentKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Scores unpublished successfully");
    },
  });
};