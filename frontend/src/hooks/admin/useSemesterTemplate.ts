// ===== File: frontend/src/hooks/admin/useSemesterTemplate.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { semesterTemplateApi } from "@/api/admin/semester-template.api";
import clientApi from "@/api/client";
import { queryKeys } from "@/hooks/queryKeys.factory";

import type {
  SemesterTemplateCreateDto,
  SemesterTemplateUpdateDto,
  AssignTemplateDto,
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";

const templateKeys = queryKeys.admin.semesterTemplates;

export const useSemesterTemplates = () => {
  return useAsyncQuery<SemesterTemplate[]>(
    templateKeys.list(),
    semesterTemplateApi.getAll,
    { meta: { preset: 'static', feature: 'semester-templates' } },
  );
};

export const useCreateSemesterTemplate = () => {
  return useMutationWithInvalidation(
    (dto: SemesterTemplateCreateDto) => semesterTemplateApi.create(dto),
    { invalidateKeys: [templateKeys.all] },
  );
};

export const useUpdateSemesterTemplate = () => {
  return useMutationWithInvalidation(
    ({ id, dto }: { id: string; dto: SemesterTemplateUpdateDto }) =>
      semesterTemplateApi.update(id, dto),
    { invalidateKeys: [templateKeys.all] },
  );
};

export const useDeleteSemesterTemplate = () => {
  return useMutationWithInvalidation(
    (id: string) => semesterTemplateApi.delete(id),
    { invalidateKeys: [templateKeys.all] },
  );
};

export const useTemplateAssignments = (schoolYearId: string | null) => {
  return useAsyncQuery<TemplateAssignment[]>(
    queryKeys.admin.semesterTemplateAssignments.list(schoolYearId ?? ""),
    () => semesterTemplateApi.getAssignmentsBySchoolYear(schoolYearId!),
    { meta: { preset: 'list', feature: 'template-assignments' }, enabled: !!schoolYearId },
  );
};

export const useProgramsBySchoolYear = (schoolYearId: string | null) => {
  return useAsyncQuery<{ id: string; name: string; type: string }[]>(
    queryKeys.admin.programs.list({ schoolYearId: schoolYearId ?? undefined } as unknown as Record<string, unknown>),
    async () => {
      const res = await clientApi.get(`/programs`, { params: { schoolYearId } });
      return res.data.data ?? [];
    },
    { meta: { preset: 'list', feature: 'programs-by-year' }, enabled: !!schoolYearId },
  );
};

export const useAssignTemplate = () => {
  return useMutationWithInvalidation(
    (dto: AssignTemplateDto) => semesterTemplateApi.assign(dto),
    { invalidateKeys: [queryKeys.admin.semesterTemplateAssignments.all] },
  );
};

export const useRemoveTemplateAssignment = () => {
  return useMutationWithInvalidation(
    (programId: string) => semesterTemplateApi.removeAssignment(programId),
    { invalidateKeys: [queryKeys.admin.semesterTemplateAssignments.all] },
  );
};