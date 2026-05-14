// client/src/modules/admin/system/hooks/useSemesterTemplates.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { semesterTemplateApi } from '../api/semester-template.api';
import type {
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  AssignSemesterTemplateDto,
  SaveTermDatesDto,
} from '../types/semester-template.types';

// ── Query keys ──────────────────────────────────────────────────────────────

export const semesterTemplateKeys = {
  all: ['semester-templates'] as const,
  lists: () => [...semesterTemplateKeys.all, 'list'] as const,
  bySchoolYear: (schoolYearId: string) =>
    [...semesterTemplateKeys.lists(), { schoolYearId }] as const,
  forOrg: () => [...semesterTemplateKeys.lists(), 'org'] as const,
  detail: (id: string) => [...semesterTemplateKeys.all, 'detail', id] as const,
  assignments: () => [...semesterTemplateKeys.all, 'assignments'] as const,
  assignmentsBySchoolYear: (schoolYearId: string) =>
    [...semesterTemplateKeys.assignments(), { schoolYearId }] as const,
};

// ── Templates ───────────────────────────────────────────────────────────────

export const useSemesterTemplatesBySchoolYear = (schoolYearId: string) => {
  return useQuery({
    queryKey: semesterTemplateKeys.bySchoolYear(schoolYearId),
    queryFn: () => semesterTemplateApi.getBySchoolYear(schoolYearId),
    enabled: !!schoolYearId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAllSemesterTemplates = () => {
  return useQuery({
    queryKey: semesterTemplateKeys.forOrg(),
    queryFn: () => semesterTemplateApi.getAllForOrg(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSemesterTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSemesterTemplateDto) =>
      semesterTemplateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semesterTemplateKeys.lists() });
    },
  });
};

export const useUpdateSemesterTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSemesterTemplateDto }) =>
      semesterTemplateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semesterTemplateKeys.lists() });
    },
  });
};

export const useDeleteSemesterTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => semesterTemplateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semesterTemplateKeys.lists() });
    },
  });
};

// ── Assignments ─────────────────────────────────────────────────────────────

export const useSemesterTemplateAssignments = (schoolYearId: string) => {
  return useQuery({
    queryKey: semesterTemplateKeys.assignmentsBySchoolYear(schoolYearId),
    queryFn: () => semesterTemplateApi.getAssignmentsBySchoolYear(schoolYearId),
    enabled: !!schoolYearId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssignSemesterTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignSemesterTemplateDto) =>
      semesterTemplateApi.assign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: semesterTemplateKeys.assignments(),
      });
    },
  });
};

export const useRemoveSemesterTemplateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) =>
      semesterTemplateApi.removeAssignment(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: semesterTemplateKeys.assignments(),
      });
    },
  });
};

export const useSaveTermDates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      data,
    }: {
      programId: string;
      data: SaveTermDatesDto;
    }) => semesterTemplateApi.saveTermDates(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: semesterTemplateKeys.assignments(),
      });
    },
  });
};